import { Router } from 'express';
import { Expo } from 'expo-server-sdk';
import { NotificationService } from '../services/notifications';
import { authenticateUser } from '../middleware/auth';

export const notificationRouter = Router();
const notificationService = NotificationService.getInstance();

// Register device token
notificationRouter.post('/token', authenticateUser, async (req, res) => {
  try {
    const { token, deviceType } = req.body;
    const userId = req.user.id;

    // Validate token format
    if (!Expo.isExpoPushToken(token)) {
      return res.status(400).json({ error: 'Invalid Expo push token' });
    }

    await notificationService.saveToken(userId, token, deviceType);
    res.status(200).json({ message: 'Token registered successfully' });
  } catch (error) {
    console.error('Error registering token:', error);
    res.status(500).json({ error: 'Failed to register token' });
  }
});

// Remove device token
notificationRouter.delete('/token', authenticateUser, async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;

    await notificationService.removeToken(userId, token);
    res.status(200).json({ message: 'Token removed successfully' });
  } catch (error) {
    console.error('Error removing token:', error);
    res.status(500).json({ error: 'Failed to remove token' });
  }
});

// Get notification preferences
notificationRouter.get('/preferences', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = await notificationService.getUserPreferences(userId);
    res.status(200).json(preferences);
  } catch (error) {
    console.error('Error getting preferences:', error);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

// Update notification preferences
notificationRouter.put('/preferences', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = req.body;

    await notificationService.updatePreferences(userId, preferences);
    res.status(200).json({ message: 'Preferences updated successfully' });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Get unread notifications count
notificationRouter.get('/unread', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await notificationService.getUnreadCount(userId);
    res.status(200).json({ count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// Mark notifications as read
notificationRouter.post('/read', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationIds } = req.body;

    if (!Array.isArray(notificationIds)) {
      return res.status(400).json({ error: 'notificationIds must be an array' });
    }

    await notificationService.markAsRead(userId, notificationIds);
    res.status(200).json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});
