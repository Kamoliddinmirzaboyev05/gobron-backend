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
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Ulandi: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Uzildi: ${client.id}`);
  }

  // Admin o'z xonasiga qo'shiladi
  @SubscribeMessage('join_admin_room')
  async handleJoinAdmin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    await client.join(`admin:${data.userId}`);
    return { event: 'joined', room: `admin:${data.userId}` };
  }

  // User o'z xonasiga qo'shiladi
  @SubscribeMessage('join_user_room')
  async handleJoinUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    await client.join(`user:${data.userId}`);
    return { event: 'joined', room: `user:${data.userId}` };
  }

  // Maydon slotlari xonasi
  @SubscribeMessage('join_field_room')
  async handleJoinField(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { fieldId: string },
  ) {
    await client.join(`field:${data.fieldId}`);
    return { event: 'joined', room: `field:${data.fieldId}` };
  }

  // Admin ga yangi booking keldi
  emitNewBooking(adminUserId: string, booking: any) {
    this.server.to(`admin:${adminUserId}`).emit('new_booking', booking);
  }

  // User ga booking holati o'zgardi
  emitBookingStatusChanged(userId: string, booking: any) {
    this.server.to(`user:${userId}`).emit('booking_status_changed', booking);
  }

  // Slot yangilandi — barcha ko'rib turganlarga
  emitSlotUpdated(fieldId: string, slot: any) {
    this.server.to(`field:${fieldId}`).emit('slot_updated', slot);
  }
}
