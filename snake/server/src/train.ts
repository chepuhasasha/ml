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
  // let summaryWriter;
  // if (logDir != null) {
  //   summaryWriter = tf.node.summaryFileWriter(logDir);
  // }

  for (let i = 0; i < agent.replayBufferSize; ++i) {
    console.log(`REPLAY BUFFER: ${i+1}/${agent.replayBufferSize}`);
    agent.playStep();
  }
  // Moving averager: cumulative reward across 100 most recent 100 episodes.
  const rewardAverager100 = new MovingAverager(100);
  // Moving averager: fruits eaten across 100 most recent 100 episodes.
  const eatenAverager100 = new MovingAverager(100);

  const optimizer = tf.train.adam(learningRate);
  let tPrev = new Date().getTime();
  let frameCountPrev = agent.frameCount;
  let averageReward100Best = -Infinity;
  let steps = 0;
  while (true) {
    agent.trainOnReplayBatch(batchSize, gamma, optimizer);
    const { cumulativeReward, done, fruitsEaten, render } = agent.playStep();
    steps += 1;
    // console.log('▷ STEP:')
    // console.log(
    //   ` ├ REWARD: ${cumulativeReward}`
    // );
    // console.log(
    //   ` ├ DONE: ${done}`
    // );
    // console.log(
    //   ` └ FRUITS EATEN: ${fruitsEaten}`
    // );

    if (done) {
      const t = new Date().getTime();
      const framesPerSecond =
        ((agent.frameCount - frameCountPrev) / (t - tPrev)) * 1e3;
      tPrev = t;
      frameCountPrev = agent.frameCount;
      rewardAverager100.append(cumulativeReward);
      eatenAverager100.append(fruitsEaten);
      const averageReward100 = rewardAverager100.average();
      const averageEaten100 = eatenAverager100.average();
      console.log(
        `█ FRAME #${agent.frameCount} - ${framesPerSecond.toFixed(1)} frames/s`
      );
      console.log(`  ├ CUMULATIVE REWARD 100: ${averageReward100.toFixed(1)}`);
      console.log(`  ├ EATEN 100 : ${averageEaten100.toFixed(2)}`);
      console.log(`  └ STEPS: ${steps}`);
      console.log(`  EPSILON: ${agent.epsilon.toFixed(3)}`);
      console.log("\n");
      console.log(render)
      console.log("\n");
      steps = 0;
      // if (summaryWriter != null) {
      //   summaryWriter.scalar(
      //     "cumulativeReward100",
      //     averageReward100,
      //     agent.frameCount
      //   );
      //   summaryWriter.scalar("eaten100", averageEaten100, agent.frameCount);
      //   summaryWriter.scalar("epsilon", agent.epsilon, agent.frameCount);
      //   summaryWriter.scalar(
      //     "framesPerSecond",
      //     framesPerSecond,
      //     agent.frameCount
      //   );
      // }
      if (
        averageReward100 >= cumulativeRewardThreshold ||
        agent.frameCount >= maxNumFrames
      ) {
        // TODO(cais): Save online network.
        break;
      }
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
    if (agent.frameCount % syncEveryFrames === 0) {
      copyWeights(agent.targetNetwork, agent.onlineNetwork);
      console.log("Sync'ed weights from online network to target network");
    }
  }
};
