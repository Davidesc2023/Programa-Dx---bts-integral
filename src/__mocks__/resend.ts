// Stub for 'resend' package — used by ts-jest during test compilation.
// The actual mock is provided per-test via jest.mock('resend', factory).
export class Resend {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_apiKey?: string) {}
  emails = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    send: (_opts: any): Promise<{ id: string }> =>
      Promise.resolve({ id: 'stub-id' }),
  };
}
