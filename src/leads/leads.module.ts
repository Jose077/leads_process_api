import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Lead, LeadSchema } from './infrastructure/database/mongoose/schemas/lead.schema';
import { CreateLeadUseCase } from './application/use-cases/create-lead/create-lead.use-case';
import { LeadRepository } from './infrastructure/database/mongoose/repository/lead.repository';
import { CreateLeadConsumer } from './infrastructure/messaging/consumers/create-lead.consumer';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

const configService = new ConfigService();

@Module({
    imports: [
        ClientsModule.register([
            {
                name: 'LEADS_RETRY_CLIENT',
                transport: Transport.RMQ,
                options: {
                urls: [`amqp://${configService.get<string>('RABBITMQ_USER')}:${configService.get<string>('RABBITMQ_PASSWORD')}@${configService.get<string>('RABBITMQ_URL')}`],
                queue: 'leads-retry-queue',
                queueOptions: {
                    durable: false
                }},
            },
        ]),
        MongooseModule.forFeature([{ name: Lead.name, schema: LeadSchema }])],
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
