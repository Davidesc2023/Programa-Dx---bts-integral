// Stub for '@nestjs/swagger' — decorator stubs for test compilation.
// These decorators are no-ops in test context.

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ApiProperty = (_opts?: unknown) => (_target: unknown, _key?: unknown): void => {};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ApiTags = (..._tags: string[]) => (_target: unknown): void => {};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ApiBearerAuth = () => (_target: unknown): void => {};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ApiOperation = (_opts?: unknown) => (_target: unknown, _key?: unknown): void => {};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ApiResponse = (_opts?: unknown) => (_target: unknown, _key?: unknown): void => {};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ApiBody = (_opts?: unknown) => (_target: unknown, _key?: unknown): void => {};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ApiParam = (_opts?: unknown) => (_target: unknown, _key?: unknown): void => {};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ApiQuery = (_opts?: unknown) => (_target: unknown, _key?: unknown): void => {};
export class DocumentBuilder {
  setTitle = () => this;
  setDescription = () => this;
  setVersion = () => this;
  addBearerAuth = () => this;
  build = () => ({});
}
export const SwaggerModule = {
  createDocument: jest.fn(),
  setup: jest.fn(),
};
