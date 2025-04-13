import { Controller, Injectable, Logger } from '@nestjs/common';
import { Ctx, EventPattern, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { CreateLeadUseCase } from 'src/leads/application/use-cases/create-lead/create-lead.use-case';
import { LeadMessageDTO } from '../dtos/lead-message.dto';
import { Lead } from 'src/leads/domain/entities/lead.entity';

@Controller()
export class CreateLeadConsumer {
  constructor(private readonly createLeadUseCase: CreateLeadUseCase) {}

  logger = new Logger(CreateLeadConsumer.name)

  @EventPattern('create-lead') 
  async handleCreateLead(@Ctx() context: RmqContext, @Payload() leadIN: LeadMessageDTO): Promise<void> {
    const channel = context.getChannelRef()
    const originalMsg = context.getMessage()
    const lead = new Lead(leadIN.name, leadIN.email, leadIN.phone);

    this.logger.log(`Received message: ${JSON.stringify(leadIN)}`);

    let createdLead = await this.createLeadUseCase.execute(lead);
    if (!!createdLead) {
      this.logger.log(`Lead created: ${JSON.stringify(createdLead)}`);
    }

    await channel.ack(originalMsg)

    return
  }
}