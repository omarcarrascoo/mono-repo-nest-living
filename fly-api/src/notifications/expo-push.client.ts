import { Injectable, Logger } from '@nestjs/common';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

@Injectable()
export class ExpoPushClient {
  private readonly logger = new Logger(ExpoPushClient.name);
  private readonly expo = new Expo();

  isValidToken(token: string): boolean {
    return Expo.isExpoPushToken(token);
  }

  async send(
    messages: ExpoPushMessage[],
  ): Promise<{ tickets: ExpoPushTicket[]; invalidTokens: string[] }> {
    const validMessages = messages.filter((m) =>
      Array.isArray(m.to)
        ? m.to.every((t) => Expo.isExpoPushToken(t))
        : Expo.isExpoPushToken(m.to as string),
    );

    if (validMessages.length === 0) {
      return { tickets: [], invalidTokens: [] };
    }

    const chunks = this.expo.chunkPushNotifications(validMessages);
    const tickets: ExpoPushTicket[] = [];
    const invalidTokens: string[] = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        ticketChunk.forEach((ticket, idx) => {
          tickets.push(ticket);
          if (
            ticket.status === 'error' &&
            ticket.details?.error === 'DeviceNotRegistered'
          ) {
            const original = chunk[idx];
            const tokens = Array.isArray(original.to) ? original.to : [original.to as string];
            invalidTokens.push(...tokens);
          }
        });
      } catch (err) {
        this.logger.error(`Expo push failed: ${(err as Error).message}`);
      }
    }

    return { tickets, invalidTokens };
  }
}
