/** Abstraction over current time so use cases stay deterministic in tests. */
export interface Clock {
  now(): Date;
}
