// Stub for '@aws-sdk/client-s3' — used by ts-jest during test compilation.
export class S3Client {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_config?: unknown) {}
  send = jest.fn().mockResolvedValue({});
}
export class PutObjectCommand {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_input?: unknown) {}
}
export class HeadBucketCommand {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_input?: unknown) {}
}
export class GetObjectCommand {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_input?: unknown) {}
}
