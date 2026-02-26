import { forwardRef, Inject } from '@nestjs/common';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EntriesService } from 'src/entries/entries.service';

@WebSocketGateway({
  namespace: '/entry',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class EntryGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    @Inject(forwardRef(() => EntriesService))
    private readonly entriesService: EntriesService,
  ) {}

  async handleConnection(client: Socket) {
    const { qrCode, sessionToken } = client.handshake.auth as {
      qrCode: string;
      sessionToken: string;
    };

    if (!qrCode || !sessionToken) {
      client.disconnect();
      return;
    }

    const { hasEntry } = await this.entriesService.checkExistingEntry(
      qrCode,
      sessionToken,
    );

    if (!hasEntry) {
      client.disconnect();
      return;
    }

    await client.join(`entry:${qrCode}`);
    await client.join(`entry:${qrCode}:${sessionToken}`);
  }
}
