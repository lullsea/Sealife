import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips properties that do not have any decorators
      forbidNonWhitelisted: true, // Throws an error if non-whitelisted properties are present
      transform: true, // Automatically transforms paylods to DTO instance classes
    }),
  );

  app.setGlobalPrefix('api');
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

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
