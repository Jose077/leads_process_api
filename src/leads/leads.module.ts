import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Lead, LeadSchema } from './infrastructure/database/mongoose/schemas/lead.schema';
import { CreateLeadUseCase } from './application/use-cases/create-lead/create-lead.use-case';
import { LeadRepository } from './infrastructure/database/mongoose/repository/lead.repository';
import { CreateLeadConsumer } from './infrastructure/messaging/consumers/create-lead.consumer';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ExternalHTTPModule } from './infrastructure/http/http.module';

@Module({
    imports: [
        ConfigModule,
        ClientsModule.registerAsync([
          {
            name: 'RETRY_LEADS_QUEUE_CLIENT',
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
              transport: Transport.RMQ,
              options: {
                urls: [
                  `amqp://${configService.get<string>('RABBITMQ_USER')}:${configService.get<string>('RABBITMQ_PASSWORD')}@${configService.get<string>('RABBITMQ_URL')}`,
                ],
                queue: 'leads-retry-queue',
                prefetchCount: 50,
                queueOptions: {
                  durable: true,
                  arguments: {
                    'x-message-ttl': 60000, // 1min
                    'x-dead-letter-exchange': '', // default exchange
                    'x-dead-letter-routing-key': 'leads-queue',
                  },
                },
              },
            }),
            inject: [ConfigService],
          },
          {
            name: 'DEAD_LEADS_QUEUE_CLIENT',
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
              transport: Transport.RMQ,
              options: {
                urls: [
                  `amqp://${configService.get<string>('RABBITMQ_USER')}:${configService.get<string>('RABBITMQ_PASSWORD')}@${configService.get<string>('RABBITMQ_URL')}`,
                ],
                queue: 'leads-dlq',
                prefetchCount: 50,
                queueOptions: {
                  durable: true,
                },
              },
            }),
            inject: [ConfigService],
          },
        ]),      
        MongooseModule.forFeature([{ name: Lead.name, schema: LeadSchema }]),
        ExternalHTTPModule
      ],
    providers: [
        CreateLeadUseCase,
        {
            provide: 'LeadRepository',
            useClass: LeadRepository,
        }, 
    ],
    controllers: [CreateLeadConsumer]
})
export class LeadsModule {}
