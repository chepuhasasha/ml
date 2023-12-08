import { SnakeGameAgent } from "./agent";
import * as tf from "@tensorflow/tfjs-node-gpu";
import { copyWeights } from "./utils";
import fs from "fs";
import { SnakeGame } from "./game";

export interface TrainOptions {
  game: {
    height: number;
    width: number;
    food: number;
    snake: number;
  };
  epsilon: {
    init: number;
    final: number;
    decay_frames: number;
  };
  gamma: number;
  learning_rate: number;
  replay_buffer_size: number;
  batch_size: number;
  thresholds: {
    cumulative_reward: number;
    max_frames: number;
  };
  sync_every_frames: number;
  version: number;
}

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
  batch_size: number,
  gamma: number,
  learning_rate: number,
  sync_every_frames: number,
  cumulative_reward_threshold: number,
  max_num_frames: number,
  version: number
) => {
  // const summaryWriter = tf.node.summaryFileWriter('./log');

  for (let i = 0; i < agent.replayBufferSize; ++i) {
    console.log(
      `FILLING THE REPLAY BUFFER: ${i + 1} / ${agent.replayBufferSize}`
    );
    agent.playStep(false);
  }

  const rewardAverager100 = new MovingAverager(100);
  const eatenAverager100 = new MovingAverager(100);

  const optimizer = tf.train.adam(learning_rate);
  let averageReward100Best = -Infinity;
  let steps = 0;

  while (true) {
    agent.trainOnReplayBatch(batch_size, gamma, optimizer);
    const { cumulativeReward, done, fruitsEaten, render } = agent.playStep();
    steps += 1;

    if (done) {
      rewardAverager100.append(cumulativeReward);
      eatenAverager100.append(fruitsEaten);
      const averageReward100 = rewardAverager100.average();
      const averageEaten100 = eatenAverager100.average();

      // РЕЗУЛЬТАТЫ ЭПИЗОДА
      console.log(`█ FRAME #${agent.frameCount} / ${max_num_frames}`);
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
        averageReward100 >= cumulative_reward_threshold ||
        agent.frameCount >= max_num_frames
      ) {
        break;
      }

      // СОХРАНЯЮ СЕТЬ
      if (averageReward100 > averageReward100Best) {
        averageReward100Best = averageReward100;
        const savePath = `./models/dqn/v${version}`
        if (!fs.existsSync(savePath)) {
          fs.mkdir(savePath, { recursive: true }, () => {});
        }
        await agent.onlineNetwork.save(`file://${savePath}`);
        console.log(`Saved DQN to ${savePath}`);
      }
    }

    // СИНХРОНИЗИРУЮ СЕТИ
    if (agent.frameCount % sync_every_frames === 0) {
      copyWeights(agent.targetNetwork, agent.onlineNetwork);
      console.log("Sync'ed weights from online network to target network");
    }
  }
};

export const main = async (options: TrainOptions) => {
  const game = new SnakeGame(
    options.game.height,
    options.game.width,
    options.game.food,
    options.game.snake
  );

  const agent = new SnakeGameAgent(
    game,
    options.replay_buffer_size,
    options.epsilon.init,
    options.epsilon.final,
    options.epsilon.decay_frames,
    options.learning_rate
  );

  await train(
    agent,
    options.batch_size,
    options.gamma,
    options.learning_rate,
    options.sync_every_frames,
    options.thresholds.cumulative_reward,
    options.thresholds.max_frames,
    options.version
  );
};