// Stub for '@sparticuz/chromium' — used by ts-jest and nest build.
const chromium = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  executablePath: (..._args: unknown[]) => Promise.resolve('/usr/bin/chromium'),
  args: [] as string[],
  defaultViewport: null,
  headless: true as boolean,
};
export default chromium;
