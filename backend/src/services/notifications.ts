import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { supabase } from '../config/supabase';
import { redisClient } from '../config/redis';

const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });

interface NotificationToken {
  token: string;
  device_type: 'ios' | 'android' | 'web';
}

interface NotificationPreference {
  chat_messages: boolean;
  matches: boolean;
  price_alerts: boolean;
  system_notifications: boolean;
}

export class NotificationService {
  private static instance: NotificationService;
  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async getUserTokens(userId: string): Promise<NotificationToken[]> {
    const { data, error } = await supabase
      .from('notification_tokens')
      .select('token, device_type')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  }

  async getUserPreferences(userId: string): Promise<NotificationPreference> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If no preferences exist, create default ones
      if (error.code === 'PGRST116') {
        const { data: newPrefs, error: createError } = await supabase
          .from('notification_preferences')
          .insert([{ user_id: userId }])
          .select()
          .single();

        if (createError) throw createError;
        return newPrefs;
      }
      throw error;
    }

    return data;
  }

  async saveToken(userId: string, token: string, deviceType: 'ios' | 'android' | 'web'): Promise<void> {
    const { error } = await supabase
      .from('notification_tokens')
      .upsert({
        user_id: userId,
        token,
        device_type: deviceType
      });

    if (error) throw error;
  }

  async removeToken(userId: string, token: string): Promise<void> {
    const { error } = await supabase
      .from('notification_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('token', token);

    if (error) throw error;
  }

  async updatePreferences(userId: string, preferences: Partial<NotificationPreference>): Promise<void> {
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        ...preferences
      });

    if (error) throw error;
  }

  private async shouldSendNotification(userId: string, type: keyof NotificationPreference): Promise<boolean> {
    const preferences = await this.getUserPreferences(userId);
    return preferences[type];
  }

  async sendPushNotification(
    userId: string,
    type: keyof NotificationPreference,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      // Check if user wants this type of notification
      const shouldSend = await this.shouldSendNotification(userId, type);
      if (!shouldSend) return;

      // Get user's tokens
      const tokens = await this.getUserTokens(userId);
      if (!tokens.length) return;

      // Prepare messages
      const messages: ExpoPushMessage[] = tokens.map(({ token }) => ({
        to: token,
        sound: 'default',
        title,
        body,
        data: {
          ...data,
          type
        }
      }));

      // Send notifications in chunks
      const chunks = expo.chunkPushNotifications(messages);
      const tickets = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('Error sending notification chunk:', error);
        }
      }

      // Store notification in history
      await supabase.from('notifications').insert({
        user_id: userId,
        type,
        title,
        body,
        data
      });

      // Update unread count in Redis cache
      const cacheKey = `unread_notifications:${userId}`;
      await redisClient.incr(cacheKey);
      await redisClient.expire(cacheKey, 86400); // Expire after 24 hours

    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      // Try to get from cache first
      const cacheKey = `unread_notifications:${userId}`;
      const cachedCount = await redisClient.get(cacheKey);

      if (cachedCount !== null) {
        return parseInt(cachedCount, 10);
      }

      // If not in cache, get from database
      const { data, error } = await supabase
        .rpc('get_unread_notifications_count', { p_user_id: userId });

      if (error) throw error;

      // Update cache
      await redisClient.setex(cacheKey, 86400, data.toString());

      return data;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  async markAsRead(userId: string, notificationIds: string[]): Promise<void> {
    try {
      const { error } = await supabase
        .rpc('mark_notifications_as_read', {
          p_user_id: userId,
          p_notification_ids: notificationIds
        });

      if (error) throw error;

      // Update cache
      const cacheKey = `unread_notifications:${userId}`;
      await redisClient.del(cacheKey);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  }
}
