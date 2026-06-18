declare const pendo: {
  initialize(options: { visitor: { id: string } }): void;
  track(event: string, properties?: Record<string, unknown>): void;
};
