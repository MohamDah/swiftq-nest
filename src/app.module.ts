import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { QueuesModule } from './queues/queues.module';
import { EntriesModule } from './entries/entries.module';
import { EventsModule } from './events/events.module';
import { PushModule } from './push/push.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({ isGlobal: true }),
    EventsModule,
    PushModule,
    AuthModule,
    QueuesModule,
    EntriesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
