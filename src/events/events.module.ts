import { Module, Global, forwardRef } from '@nestjs/common';
import { EventsService } from './events.service';
import { ConfigModule } from '@nestjs/config';
import { QueueGateway } from './gateways/queue.gateway';
import { EntriesModule } from 'src/entries/entries.module';
import { EntryGateway } from './gateways/entry.gateway';

@Global()
@Module({
  imports: [ConfigModule, forwardRef(() => EntriesModule)],
  providers: [EventsService, QueueGateway, EntryGateway],
  exports: [EventsService],
})
export class EventsModule {}
