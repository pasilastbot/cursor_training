import request from 'supertest';
import express from 'express';
import { messagesRouter } from '../../routes/messages';
import { supabase } from '../../config/supabase';

jest.mock('../../config/supabase', () => ({
  supabase: {
    from: jest.fn((table: string) => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn()
    }))
  }
}));

const app = express();
app.use(express.json());
app.use('/messages', messagesRouter);

describe('Messages Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /messages', () => {
    it('should get user conversations successfully', async () => {
      const mockConversations = [
        { id: 1, participant1: '123', participant2: '456' }
      ];
      const mockResponse = { data: mockConversations, error: null };

      const mockSelect = jest.fn().mockReturnThis();
      const mockOr = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue(mockResponse);

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        or: mockOr,
        order: mockOrder
      });

      const response = await request(app)
        .get('/messages')
        .query({ user_id: '123' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockConversations);
    });

    it('should handle get conversations error', async () => {
      const mockError = new Error('Database error');

      const mockSelect = jest.fn().mockReturnThis();
      const mockOr = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockRejectedValue(mockError);

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        or: mockOr,
        order: mockOrder
      });

      const response = await request(app)
        .get('/messages')
        .query({ user_id: '123' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Database error');
    });
  });

  describe('GET /messages/:conversationId', () => {
    it('should get conversation messages successfully', async () => {
      const mockMessages = [
        { id: 1, content: 'Hello', sender_id: '123' }
      ];
      const mockResponse = { data: mockMessages, error: null };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockReturnThis();
      const mockRange = jest.fn().mockResolvedValue(mockResponse);

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
        range: mockRange
      });

      const response = await request(app)
        .get('/messages/1')
        .query({ page: 1, limit: 50 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockMessages);
    });
  });

  describe('POST /messages/:conversationId', () => {
    it('should send message successfully', async () => {
      const mockMessage = { id: 1, content: 'Hello', sender_id: '123' };
      const mockResponse = { data: mockMessage, error: null };
      const mockUpdateResponse = { error: null };

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue(mockResponse);

      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue(mockUpdateResponse);

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({
          insert: mockInsert,
          select: mockSelect,
          single: mockSingle
        })
        .mockReturnValueOnce({
          update: mockUpdate,
          eq: mockEq
        });

      const response = await request(app)
        .post('/messages/1')
        .send({
          user_id: '123',
          content: 'Hello'
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockMessage);
    });

    it('should handle send message error', async () => {
      const mockError = new Error('Send failed');

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockRejectedValue(mockError);

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle
      });

      const response = await request(app)
        .post('/messages/1')
        .send({
          user_id: '123',
          content: 'Hello'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Send failed');
    });
  });

  describe('PUT /messages/:messageId/read', () => {
    it('should mark message as read successfully', async () => {
      const mockMessage = { id: 1, read: true };
      const mockResponse = { data: mockMessage, error: null };

      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue(mockResponse);

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
        select: mockSelect,
        single: mockSingle
      });

      const response = await request(app)
        .put('/messages/1/read');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockMessage);
    });
  });

  describe('GET /messages/unread', () => {
    it('should get unread message count successfully', async () => {
      const mockMessages = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const mockResponse = { data: mockMessages, error: null };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockResolvedValue(mockResponse);

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        eq: mockEq1
      });

      (mockEq1 as jest.Mock).mockReturnValue({ eq: mockEq2 });

      const response = await request(app)
        .get('/messages/unread')
        .query({ user_id: '123' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ count: 3 });
    });
  });
});
