import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ExchangeRateService } from './exchange-rate.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      // El tiempo de espera se fija también aquí, y no sólo por petición, para
      // que ninguna llamada futura pueda quedarse colgada por olvido.
      useFactory: (configService: ConfigService) => ({
        timeout: configService.getOrThrow<number>('EXCHANGE_TIMEOUT_MS'),
        maxRedirects: 2,
      }),
    }),
  ],
  providers: [ExchangeRateService],
  exports: [ExchangeRateService],
})
export class ExchangeRateModule {}
