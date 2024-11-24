import { DEBUG } from '../config/constants';

export function log(...args) {
  if (DEBUG) {
    console.log("[Empty Notes Cleaner]", ...args);
  }
} 