import {
  BadRequestException,
  Injectable,
  type PipeTransform,
} from '@nestjs/common';

// Ids are Postgres "integer" columns: 1 to 2147483647. ParseIntPipe accepts
// any integer, so /habits/99999999999 reached Postgres and became a 500.
const MAX_ID = 2147483647;

@Injectable()
export class ParseIdPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    // Digits only: no sign, no decimal point, no "1e3".
    const id = /^\d+$/.test(value) ? Number(value) : NaN;
    // Written this way round so NaN fails too: every comparison with NaN is false.
    if (!(id >= 1 && id <= MAX_ID)) {
      throw new BadRequestException(
        `Validation failed (id must be an integer from 1 to ${MAX_ID})`,
      );
    }
    return id;
  }
}
