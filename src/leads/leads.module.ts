import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Lead, LeadSchema } from './infrastructure/database/mongoose/schemas/lead.schema';
import { CreateLeadUseCase } from './application/use-cases/create-lead.service';
import { LeadRepository } from './infrastructure/database/mongoose/repository/lead.repository';
import { CreateLeadConsumer } from './infrastructure/messaging/consumers/create-lead.consumer';
@Module({
    imports: [MongooseModule.forFeature([{ name: Lead.name, schema: LeadSchema }])],
    providers: [
        CreateLeadUseCase,
        {
            provide: 'LeadRepository',
            useClass: LeadRepository,
        }
    ],
    controllers: [CreateLeadConsumer]
})
export class LeadsModule {}
