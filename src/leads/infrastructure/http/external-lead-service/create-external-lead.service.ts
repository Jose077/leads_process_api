import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { CreateExternalLeadDto } from '../dtos/create-external-lead.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CreateExternalLeadService {
  private readonly logger = new Logger(CreateExternalLeadService.name);

  constructor(
      private readonly httpService: HttpService,
      private readonly configService: ConfigService,
  ) {}

  async sendLeadToExternalSystem(lead: CreateExternalLeadDto): Promise<void> {
    try {
      const url = this.configService.get<string>('EXTERNAL_SERVICE_URL') ?? ''

      await firstValueFrom(
        this.httpService.post(url, lead).pipe(
          catchError((error: AxiosError) => {
            this.logger.error('Error sending lead to external API:', error.message ?? error);
            throw error;
          }),
        ),
      );

      this.logger.log(`Lead ${lead.name} created on external system`);
    } catch (err) {
      throw new Error('Failed to send lead to external system', err.message);
    }
  }
}
