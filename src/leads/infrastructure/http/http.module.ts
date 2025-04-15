import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CreateExternalLeadService } from './external-lead-service/create-external-lead.service';

@Module({
  imports: [HttpModule],
  providers: [CreateExternalLeadService],
  exports: [CreateExternalLeadService],
})
export class ExternalHTTPModule {}
