// Stub for '@nestjs/swagger' — decorator stubs for test/build compilation.
// These decorators are no-ops in test context.

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ApiProperty = (_opts?: unknown) => (_target: unknown, _key?: unknown): void => {};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ApiPropertyOptional = (_opts?: unknown) => (_target: unknown, _key?: unknown): void => {};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ApiTags = (..._tags: string[]) => (_target: unknown): void => {};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ApiBearerAuth = (_name?: string) => (_target: unknown, _key?: unknown, _descriptor?: unknown): void => {};
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ApiConsumes = (..._mimeTypes: string[]) => (_target: unknown, _key?: unknown): void => {};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ApiExcludeEndpoint = (_disable?: boolean) => (_target: unknown, _key?: unknown): void => {};
export class DocumentBuilder {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setTitle = (..._args: unknown[]) => this;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setDescription = (..._args: unknown[]) => this;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setVersion = (..._args: unknown[]) => this;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  addBearerAuth = (..._args: unknown[]) => this;
  build = (): Record<string, unknown> => ({});
}
export const SwaggerModule = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  createDocument: (..._args: unknown[]) => ({}),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setup: (..._args: unknown[]) => {},
};
