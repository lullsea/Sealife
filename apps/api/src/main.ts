import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { configureApp } from './configure-app';
import { ConfigService } from '@nestjs/config';
import type { Env } from './config/env.validation';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const env = app.get<ConfigService<Env, true>>(ConfigService);
  await app.listen(env.get('PORT', { infer: true }));
  // Validation pipe and the /api prefix, shared with the e2e tests.
  configureApp(app);

  // Swagger UI at /docs, raw OpenAPI JSON at /docs-json.
  // addBearerAuth() adds the "Authorize" button for JWT-protected routes.
  const config = new DocumentBuilder()
    .setTitle('Sealife API')
    .setVersion('0.0.1')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, () =>
    SwaggerModule.createDocument(app, config),
  );

  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
