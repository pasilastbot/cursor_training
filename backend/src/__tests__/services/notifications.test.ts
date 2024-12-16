import { NotificationService } from '../../services/notifications';
import { supabase } from '../../config/supabase';
import { redisClient } from '../../config/redis';
import { Expo } from 'expo-server-sdk';

// Mock Supabase
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn()
      }))
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn()
      }))
    })),
    upsert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn()
      }))
    })),
    delete: jest.fn(() => ({
      eq: jest.fn()
    }))
  })),
  rpc: jest.fn()
};

jest.mock('../../config/supabase', () => ({
  supabase: mockSupabase
}));

// Mock Redis
jest.mock('../../config/redis', () => ({
  redisClient: {
    get: jest.fn(),
    setex: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    del: jest.fn()
  }
}));

// Mock Expo
jest.mock('expo-server-sdk', () => ({
  Expo: jest.fn().mockImplementation(() => ({
    chunkPushNotifications: jest.fn().mockReturnValue([[{ to: 'token1' }]]),
    sendPushNotificationsAsync: jest.fn().mockResolvedValue([{ status: 'ok' }])
  }))
}));

describe('NotificationService', () => {
  let notificationService: NotificationService;
  const mockUserId = 'user-123';
  const mockToken = 'ExponentPushToken[xxx]';

  beforeEach(() => {
    notificationService = NotificationService.getInstance();
    jest.clearAllMocks();
  });

  describe('getUserTokens', () => {
    it('should return user tokens', async () => {
      const mockTokens = [{ token: mockToken, device_type: 'ios' }];
      const mockEq = jest.fn().mockResolvedValue({ data: mockTokens, error: null });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      });

      const tokens = await notificationService.getUserTokens(mockUserId);
      expect(tokens).toEqual(mockTokens);
      expect(mockSelect).toHaveBeenCalledWith('token, device_type');
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUserId);
    });

    it('should handle errors', async () => {
      const mockError = new Error('Database error');
      const mockEq = jest.fn().mockResolvedValue({ data: null, error: mockError });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      });

      await expect(notificationService.getUserTokens(mockUserId)).rejects.toThrow(mockError);
    });
  });

  describe('getUserPreferences', () => {
    it('should return user preferences', async () => {
      const mockPreferences = {
        chat_messages: true,
        matches: true,
        price_alerts: true,
        system_notifications: true
      };

      const mockSingle = jest.fn().mockResolvedValue({ data: mockPreferences, error: null });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      });

      const preferences = await notificationService.getUserPreferences(mockUserId);
      expect(preferences).toEqual(mockPreferences);
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUserId);
    });

    it('should create default preferences if none exist', async () => {
      const mockError = { code: 'PGRST116' };
      const mockDefaultPreferences = {
        chat_messages: true,
        matches: true,
        price_alerts: true,
        system_notifications: true
      };

      const mockSingle = jest.fn()
        .mockResolvedValueOnce({ data: null, error: mockError })
        .mockResolvedValueOnce({ data: mockDefaultPreferences, error: null });

      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      const mockInsertSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockInsertSelect });

      mockSupabase.from
        .mockReturnValueOnce({
          select: mockSelect
        })
        .mockReturnValueOnce({
          insert: mockInsert
        });

      const preferences = await notificationService.getUserPreferences(mockUserId);
      expect(preferences).toEqual(mockDefaultPreferences);
    });
  });

  describe('sendPushNotification', () => {
    const mockNotification = {
      title: 'Test Title',
      body: 'Test Body',
      data: { type: 'test' }
    };

    beforeEach(() => {
      const mockPreferences = { chat_messages: true };
      const mockSingle = jest.fn().mockResolvedValue({ data: mockPreferences, error: null });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        insert: jest.fn().mockResolvedValue({ error: null })
      });
    });

    it('should send push notification successfully', async () => {
      const mockTokens = [{ token: mockToken, device_type: 'ios' }];
      const mockEq = jest.fn().mockResolvedValue({ data: mockTokens, error: null });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      mockSupabase.from
        .mockReturnValueOnce({
          select: mockSelect
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockResolvedValue({ error: null })
        });

      await notificationService.sendPushNotification(
        mockUserId,
        'chat_messages',
        mockNotification.title,
        mockNotification.body,
        mockNotification.data
      );

      expect(redisClient.incr).toHaveBeenCalled();
      expect(redisClient.expire).toHaveBeenCalled();
    });

    it('should not send notification if user has disabled them', async () => {
      const mockPreferences = { chat_messages: false };
      const mockSingle = jest.fn().mockResolvedValue({ data: mockPreferences, error: null });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      });

      await notificationService.sendPushNotification(
        mockUserId,
        'chat_messages',
        mockNotification.title,
        mockNotification.body,
        mockNotification.data
      );

      expect(redisClient.incr).not.toHaveBeenCalled();
    });
  });

  describe('getUnreadCount', () => {
    it('should return cached count if available', async () => {
      (redisClient.get as jest.Mock).mockResolvedValue('5');

      const count = await notificationService.getUnreadCount(mockUserId);
      expect(count).toBe(5);
      expect(supabase.rpc).not.toHaveBeenCalled();
    });

    it('should fetch count from database if not cached', async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(null);
      (supabase.rpc as jest.Mock).mockResolvedValue({ data: 3, error: null });

      const count = await notificationService.getUnreadCount(mockUserId);
      expect(count).toBe(3);
      expect(redisClient.setex).toHaveBeenCalled();
    });
  });

  describe('markAsRead', () => {
    it('should mark notifications as read', async () => {
      const mockNotificationIds = ['notification-1', 'notification-2'];
      (supabase.rpc as jest.Mock).mockResolvedValue({ error: null });

      await notificationService.markAsRead(mockUserId, mockNotificationIds);
      expect(redisClient.del).toHaveBeenCalled();
    });

    it('should handle errors when marking as read', async () => {
      const mockNotificationIds = ['notification-1'];
      const mockError = new Error('Database error');
      (supabase.rpc as jest.Mock).mockResolvedValue({ error: mockError });

      await expect(notificationService.markAsRead(mockUserId, mockNotificationIds)).rejects.toThrow(mockError);
    });
  });
});
