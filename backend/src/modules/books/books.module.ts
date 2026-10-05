import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExchangeRateModule } from '../exchange-rate/exchange-rate.module';
import { Book } from './book.entity';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';

@Module({
  imports: [TypeOrmModule.forFeature([Book]), ExchangeRateModule],
  controllers: [BooksController],
  providers: [BooksService],
})
export class BooksModule {}
