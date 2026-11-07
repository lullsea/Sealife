import { ValidationPipe, type INestApplication } from '@nestjs/common';

// How every request is handled, outside the modules. Shared by main.ts and the
// e2e tests, so the tests run the same pipeline as production (testing.md §6.3).
export function configureApp(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips properties that do not have any decorators
      forbidNonWhitelisted: true, // Throws an error if non-whitelisted properties are present
      transform: true, // Automatically transforms paylods to DTO instance classes
    }),
  );

  app.setGlobalPrefix('api');
}
