import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationPayload } from './interfaces/notification-payload.interface';
import { FirebaseMessagingError } from 'firebase-admin/messaging';

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    try {
      const serviceAccountJson = this.config.getOrThrow<string>(
        'FIREBASE_SERVICE_ACCOUNT_JSON',
      );

      // Support both file path (local dev) and JSON string (Heroku)
      const credential = admin.credential.cert(
        JSON.parse(serviceAccountJson) as Record<string, string>,
      );

      // Initialize Firebase Admin SDK only if not already initialized
      if (admin.apps.length === 0) {
        admin.initializeApp({ credential });
        this.logger.log('Firebase Admin SDK initialized successfully');
      } else {
        this.logger.log(
          'Firebase Admin SDK already initialized, skipping re-initialization',
        );
      }
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK', error);
    }
  }

  async subscribe(
    entryId: string,
    fcmToken: string,
    userAgent?: string,
  ): Promise<{ success: boolean }> {
    try {
      // Verify the entry exists
      await this.prisma.queueEntry.findUniqueOrThrow({
        where: { id: entryId },
      });

      await this.prisma.pushSubscription.deleteMany({
        where: { entryId },
      });

      await this.prisma.pushSubscription.create({
        data: {
          entryId,
          fcmToken,
          userAgent,
        },
      });

      this.logger.log(`Push subscription saved for entry ${entryId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to save subscription for entry ${entryId}`,
        error,
      );
      throw error;
    }
  }

  async sendNotification(
    entryId: string,
    payload: NotificationPayload,
  ): Promise<void> {
    try {
      // Get all subscriptions for this entry
      const subscription = await this.prisma.pushSubscription.findUnique({
        where: { entryId },
      });

      if (!subscription) {
        this.logger.debug(`No push subscriptions found for entry ${entryId}`);
        return;
      }

      try {
        const message: admin.messaging.Message = {
          token: subscription.fcmToken,
          data: {
            ...payload.data,
            title: payload.title,
            body: payload.body,
            qrCode: payload.data.qrCode,
          },
        };

        await admin.messaging().send(message);
        this.logger.log(
          `Push sent successfully to token ending in ...${subscription.fcmToken.slice(-8)}`,
        );
      } catch (error: any) {
        // Handle invalid/expired tokens
        if (
          error instanceof FirebaseMessagingError &&
          (error.code === 'messaging/invalid-registration-token' ||
            error.code === 'messaging/registration-token-not-registered')
        ) {
          this.logger.warn(
            `Removing invalid/expired token for subscription ${subscription.id}`,
          );
          await this.prisma.pushSubscription.delete({
            where: { id: subscription.id },
          });
        } else {
          this.logger.error(
            `Failed to send push to subscription ${subscription.id}`,
            error,
          );
        }
      }

      this.logger.log(`Sent notification for entry ${entryId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send notification for entry ${entryId}`,
        error,
      );
    }
  }

  /**
   * Unsubscribe by FCM token
   */
  async unsubscribe(fcmToken: string): Promise<{ success: boolean }> {
    try {
      await this.prisma.pushSubscription.delete({
        where: { fcmToken },
      });
      this.logger.log(`Unsubscribed token ending in ...${fcmToken.slice(-8)}`);
      return { success: true };
    } catch (error) {
      this.logger.error('Failed to unsubscribe', error);
      throw error;
    }
  }

  /**
   * Delete subscription by entry ID (for cleanup)
   */
  async deleteSubscriptionByEntry(entryId: string): Promise<void> {
    try {
      const result = await this.prisma.pushSubscription.deleteMany({
        where: { entryId },
      });

      if (result.count > 0) {
        this.logger.log(
          `Deleted ${result.count} subscription(s) for entry ${entryId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to delete subscription for entry ${entryId}`,
        error,
      );
    }
  }

  /**
   * Get subscription status for an entry
   */
  async getSubscriptionStatus(
    entryId: string,
  ): Promise<{ isSubscribed: boolean }> {
    const subscription = await this.prisma.pushSubscription.findUnique({
      where: { entryId },
    });

    return {
      isSubscribed: !!subscription,
    };
  }
}
