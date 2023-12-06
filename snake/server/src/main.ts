import { SnakeGame } from "./utils";
import { train } from "./train";
import { SnakeGameAgent } from "./agent";
import config from './train_config.json'
console.log(config)

export interface TrainOptions {
  game: {
    height: number;
    width: number;
    food: number;
    snake: number;
  };
  replayBufferSize: number;
  epsilonInit: number;
  epsilonFinal: number;
  epsilonDecayFrames: number;
  learningRate: number;
  batchSize: number;
  gamma: number;
  cumulativeRewardThreshold: number;
  maxNumFrames: number;
  syncEveryFrames: number;
  savePath: string;
  logDir: string;
  useGPU: boolean;
}

const main = async (options: TrainOptions) => {
  const game = new SnakeGame(
    options.game.height,
    options.game.width,
    options.game.food,
    options.game.snake
  );

  const agent = new SnakeGameAgent(
    game,
    options.replayBufferSize,
    options.epsilonInit,
    options.epsilonFinal,
    options.epsilonDecayFrames,
    options.learningRate
  );

  await train(
    agent,
    options.batchSize,
    options.gamma,
    options.learningRate,
    options.syncEveryFrames,
    options.cumulativeRewardThreshold,
    options.maxNumFrames,
    options.savePath,
    options.useGPU
  );
};

main(config)