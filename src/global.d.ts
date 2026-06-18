declare const pendo: {
  initialize(options: { visitor: { id: string; [key: string]: unknown } }): void;
  identify(options: { visitor: { id: string; [key: string]: unknown } }): void;
  track(event: string, properties?: Record<string, unknown>): void;
};
