// Stub for '@sparticuz/chromium' — used by ts-jest during test compilation.
const chromium = {
  executablePath: jest.fn().mockResolvedValue('/usr/bin/chromium'),
  args: [] as string[],
  defaultViewport: null,
};
export default chromium;
