import { plainToInstance, Type } from 'class-transformer';
import {
  IsInt,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

// Every environment variable the app reads, checked once at startup.
// The TypeORM CLI and make-admin don't start Nest, so they still read .env
// through data-source.ts (config.md §2.8).
export class Env {
  // Env vars are always strings; @Type turns "3000" into 3000.
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  // require_tld: false allows localhost. require_protocol: false would let
  // "localhost:5432" through and fail later, inside the driver.
  @IsUrl({
    protocols: ['postgres', 'postgresql'],
    require_protocol: true,
    require_tld: false,
  })
  DATABASE_URL: string;

  // HS256 needs a key of at least 256 bits (RFC 7518 §3.2).
  // Generate one with: openssl rand -base64 32
  @IsString()
  @MinLength(32)
  JWT_SECRET: string;

  @IsUrl({
    protocols: ['redis', 'rediss'],
    require_protocol: true,
    require_tld: false,
  })
  REDIS_URL: string;
}

// ConfigModule calls this with .env merged with process.env. Throwing here
// stops the app before it listens on a port.
export function validate(config: Record<string, unknown>): Env {
  const env = plainToInstance(Env, config);
  const errors = validateSync(env);
  if (errors.length > 0) {
    const lines = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    throw new Error(`Invalid environment:\n  - ${lines.join('\n  - ')}`);
  }
  return env;
}
