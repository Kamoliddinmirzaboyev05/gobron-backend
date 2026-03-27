import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'bookings',
})
export class BookingsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected to BookingsGateway: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected from BookingsGateway: ${client.id}`);
  }

  /**
   * Admin joins their specific room to receive booking updates
   */
  @SubscribeMessage('joinAdminRoom')
  async handleJoinAdmin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { adminId: string },
  ) {
    if (data.adminId) {
      await client.join(`admin:${data.adminId}`);
      console.log(`Admin ${data.adminId} joined their room`);
      return { event: 'joined', room: `admin:${data.adminId}` };
    }
  }

  /**
   * User joins their specific room to receive booking status updates
   */
  @SubscribeMessage('joinUserRoom')
  async handleJoinUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    if (data.userId) {
      await client.join(`user:${data.userId}`);
      console.log(`User ${data.userId} joined their room`);
      return { event: 'joined', room: `user:${data.userId}` };
    }
  }

  /**
   * Emits new booking event to the specific admin
   */
  sendNewBooking(adminId: string, booking: any) {
    this.server.to(`admin:${adminId}`).emit('newBooking', booking);
  }

  /**
   * Emits booking update event to the specific user and admin
   */
  sendBookingUpdated(userId: string, adminId: string, booking: any) {
    // Notify user
    this.server.to(`user:${userId}`).emit('bookingUpdated', booking);
    // Notify admin
    this.server.to(`admin:${adminId}`).emit('bookingUpdated', booking);
  }
}
