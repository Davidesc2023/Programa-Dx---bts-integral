import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Swagger setup (before helmet so assets load correctly)
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Lab Request API')
    .setDescription('Sistema de Gestión de Solicitudes de Laboratorio')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  // Helmet with CSP disabled only for Swagger UI compatibility on internal API
  app.use(
    helmet({ contentSecurityPolicy: false }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Accept comma-separated origins or wildcard from CORS_ORIGIN env var.
  // Fallback to '*' so the Vercel frontend can reach this API without config.
  const rawOrigin = process.env.CORS_ORIGIN ?? '*';
  const corsOrigin: string | string[] =
    rawOrigin === '*' ? '*' : rawOrigin.split(',').map((o) => o.trim());

  app.enableCors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: rawOrigin !== '*',
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

bootstrap();
