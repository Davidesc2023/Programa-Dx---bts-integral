// Stub for 'puppeteer-core' — used by ts-jest during test compilation.
const puppeteer = {
  launch: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue({
      setContent: jest.fn(),
      pdf: jest.fn().mockResolvedValue(Buffer.from('')),
    }),
    close: jest.fn(),
  }),
};
export default puppeteer;
