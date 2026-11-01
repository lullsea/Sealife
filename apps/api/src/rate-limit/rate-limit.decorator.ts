import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import {
  RATE_LIMIT_KEY,
  RateLimitGuard,
  type RateLimitRule,
} from './rate-limit.guard';

// @RateLimit(rule, ...) stores the rules and attaches the guard that reads
// them, so a route can't get one without the other.
export const RateLimit = (...rules: RateLimitRule[]) =>
  applyDecorators(
    SetMetadata(RATE_LIMIT_KEY, rules),
    UseGuards(RateLimitGuard),
  );
