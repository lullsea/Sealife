import { TokenRevocationService } from './token-revocation.service';
import { Module } from '@nestjs/common';

@Module({
  providers: [TokenRevocationService],
  exports: [TokenRevocationService],
})
export class TokenRevocationModule {}
