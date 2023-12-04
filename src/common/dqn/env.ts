import type { LayersModel } from "@tensorflow/tfjs";

export interface Env {
  readonly num_actions: number,
  readonly all_actions: number[],
  q_net: LayersModel | null,
  auto_play: boolean,
  interval: number,
  job: number
}
