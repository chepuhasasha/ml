import { util } from "@tensorflow/tfjs-node-gpu";
import type { Action, State } from "./game";

export type BufferItem = [State, Action, number, boolean, State]; // - Stane, Action, reward, done, Next State

export class Memory {
  buffer: (BufferItem | null)[] = [];
  bufferIndices_: number[] = [];
  index: number = 0;
  length: number = 0;
  maxLen: number;
  constructor(maxLen: number) {
    this.maxLen = maxLen;
    this.buffer = [];
    for (let i = 0; i < maxLen; ++i) {
      this.buffer.push(null);
    }
    this.index = 0;
    this.length = 0;

    this.bufferIndices_ = [];
    for (let i = 0; i < maxLen; ++i) {
      this.bufferIndices_.push(i);
    }
  }

  append(item: BufferItem) {
    this.buffer[this.index] = item;
    this.length = Math.min(this.length + 1, this.maxLen);
    this.index = (this.index + 1) % this.maxLen;
  }

  sample(batchSize: number) {
    if (batchSize > this.maxLen) {
      throw new Error(
        `batchSize (${batchSize}) exceeds buffer length (${this.maxLen})`
      );
    }
    util.shuffle(this.bufferIndices_);

    const out = [];
    for (let i = 0; i < batchSize; ++i) {
      out.push(this.buffer[this.bufferIndices_[i]]);
    }
    return out;
  }
}
