import type { SnakeGameAgent } from "./agent";
import * as tf from "@tensorflow/tfjs-node-gpu";
import { copyWeights } from "./utils";
import fs from "fs";

class MovingAverager {
  buffer: number[] = [];
  constructor(bufferLength: number) {
    this.buffer = Array(bufferLength).fill(0);
  }

  append(x: number) {
    this.buffer.shift();
    this.buffer.push(x);
  }

  average() {
    return (
      this.buffer.reduce((x, prev) => {
        if (prev) {
          return x + prev;
        } else {
          return x;
        }
      }, 0) / this.buffer.length
    );
  }
}

export const train = async (
  agent: SnakeGameAgent,
  batchSize: number,
  gamma: number,
  learningRate: number,
  syncEveryFrames: number,
  cumulativeRewardThreshold: number,
  maxNumFrames: number,
  savePath: string,
  useGPU: boolean
) => {
  // const summaryWriter = tf.node.summaryFileWriter('./log');

  for (let i = 0; i < agent.replayBufferSize; ++i) {
    console.log(
      `FILLING THE REPLAY BUFFER: ${i + 1} / ${agent.replayBufferSize}`
    );
    agent.playStep();
  }

  const rewardAverager100 = new MovingAverager(100);
  const eatenAverager100 = new MovingAverager(100);

  const optimizer = tf.train.adam(learningRate);
  let averageReward100Best = -Infinity;
  let steps = 0;

  while (true) {
    agent.trainOnReplayBatch(batchSize, gamma, optimizer);
    const { cumulativeReward, done, fruitsEaten, render } = agent.playStep();
    steps += 1;

    if (done) {
      rewardAverager100.append(cumulativeReward);
      eatenAverager100.append(fruitsEaten);
      const averageReward100 = rewardAverager100.average();
      const averageEaten100 = eatenAverager100.average();

      // РЕЗУЛЬТАТЫ ЭПИЗОДА
      console.log(`█ FRAME #${agent.frameCount} / ${maxNumFrames}`);
      console.log(`  ├ CUMULATIVE REWARD 100: ${averageReward100.toFixed(1)}`);
      console.log(`  ├ EATEN 100 : ${averageEaten100.toFixed(2)}`);
      console.log(`  └ STEPS: ${steps}`);
      console.log(`  EPSILON: ${agent.epsilon.toFixed(3)}`);
      console.log("DEATH SNAPSHOT:");
      console.log(render);
      steps = 0;

      // // LOG
      // summaryWriter.scalar(
      //   "cumulativeReward100",
      //   averageReward100,
      //   agent.frameCount
      // );
      // summaryWriter.scalar("eaten100", averageEaten100, agent.frameCount);
      // summaryWriter.scalar("epsilon", agent.epsilon, agent.frameCount);
      // summaryWriter.scalar(
      //   "framesPerSecond",
      //   framesPerSecond,
      //   agent.frameCount
      // );

      // ПРЕРЫВАЮ ЦИКЛ
      if (
        averageReward100 >= cumulativeRewardThreshold ||
        agent.frameCount >= maxNumFrames
      ) {
        break;
      }

      // СОХРАНЯЮ СЕТЬ
      if (averageReward100 > averageReward100Best) {
        averageReward100Best = averageReward100;
        if (savePath != null) {
          if (!fs.existsSync(savePath)) {
            fs.mkdir(savePath, { recursive: true }, () => {});
          }
          await agent.onlineNetwork.save(`file://${savePath}`);
          console.log(`Saved DQN to ${savePath}`);
        }
      }
    }

    // СИНХРОНИЗИРУЮ СЕТИ
    if (agent.frameCount % syncEveryFrames === 0) {
      copyWeights(agent.targetNetwork, agent.onlineNetwork);
      console.log("Sync'ed weights from online network to target network");
    }
  }
};
