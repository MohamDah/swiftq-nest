import { ConfigService } from '@nestjs/config';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

@WebSocketGateway({
  namespace: '/queue',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class QueueGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(private readonly configService: ConfigService) {}

  async handleConnection(client: Socket) {
    const { token, queueId } = client.handshake.auth as {
      token: string;
      queueId: string;
    };

    if (!token || !queueId) {
      client.disconnect();
      return;
    }

    try {
      jwt.verify(token, this.configService.getOrThrow('JWT_SECRET'));
    } catch {
      client.disconnect();
      return;
    }

    await client.join(`queue:${queueId}`);
  }
}
