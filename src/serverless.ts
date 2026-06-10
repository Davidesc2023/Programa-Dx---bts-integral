import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as express from 'express';

let cachedExpressApp: express.Express | null = null;

async function createExpressApp(): Promise<express.Express> {
  const server = express();
  const adapter = new ExpressAdapter(server);

  const app = await NestFactory.create(AppModule, adapter, { bufferLogs: false });

  const isProd = process.env.NODE_ENV === 'production';
  app.use(helmet({ contentSecurityPolicy: isProd }));

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  const rawOrigin = process.env.CORS_ORIGIN ?? '*';
  const corsOrigin: string | string[] =
    rawOrigin === '*' ? '*' : rawOrigin.split(',').map((o) => o.trim());

  app.enableCors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: rawOrigin !== '*',
  });

  await app.init();
  return server;
}

export async function handler(
  req: express.Request,
  res: express.Response,
): Promise<void> {
  if (!cachedExpressApp) {
    cachedExpressApp = await createExpressApp();
  }
  cachedExpressApp(req, res);
}
