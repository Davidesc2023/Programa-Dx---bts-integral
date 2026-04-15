// Stub for 'puppeteer-core' — used by ts-jest and nest build.
const puppeteer = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  launch: (..._args: unknown[]) => Promise.resolve({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    newPage: (..._a: unknown[]) => Promise.resolve({
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      setContent: (..._b: unknown[]) => Promise.resolve(),
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      pdf: (..._c: unknown[]) => Promise.resolve(Buffer.from('')),
    }),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    close: (..._d: unknown[]) => Promise.resolve(),
  }),
};
export default puppeteer;
