import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { LeadsModule } from './leads/leads.module';

const configService = new ConfigService();

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true}),
    MongooseModule.forRoot(configService.get<string>('MONGO_URI') ?? ''),
    LeadsModule
  ],
})
export class AppModule {}
