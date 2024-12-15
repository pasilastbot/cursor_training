import request from 'supertest';
import express from 'express';
import { messagesRouter } from '../messages';
import { supabase } from '../../config/supabase';

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
        {
          id: 1,
          participant1: '123',
          participant2: '456',
          last_message: { content: 'Hello' },
        },
      ];
      const mockResponse = { data: mockConversations, error: null };
      const mockSelect = jest.fn().mockReturnThis();
      const mockOr = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue(mockResponse);

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        or: mockOr,
        order: mockOrder,
      });

      const response = await request(app)
        .get('/messages')
        .query({ user_id: '123' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockConversations);
    });

    it('should handle get conversations error', async () => {
      const mockError = { error: { message: 'Database error' }, data: null };
      const mockSelect = jest.fn().mockReturnThis();
      const mockOr = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue(mockError);

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        or: mockOr,
        order: mockOrder,
      });

      const response = await request(app)
        .get('/messages')
        .query({ user_id: '123' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /messages/:conversationId', () => {
    it('should get conversation messages successfully', async () => {
      const mockMessages = [
        { id: 1, sender_id: '123', content: 'Hello' },
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
        range: mockRange,
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
      const mockMessage = {
        id: 1,
        sender_id: '123',
        conversation_id: '1',
        content: 'Hello',
      };
      const mockResponse = { data: mockMessage, error: null };
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue(mockResponse);

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      });

      const response = await request(app)
        .post('/messages/1')
        .send({
          user_id: '123',
          content: 'Hello',
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockMessage);
    });

    it('should handle send message error', async () => {
      const mockError = { error: { message: 'Database error' }, data: null };
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue(mockError);

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      });

      const response = await request(app)
        .post('/messages/1')
        .send({
          user_id: '123',
          content: 'Hello',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
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
        single: mockSingle,
      });

      const response = await request(app)
        .put('/messages/1/read');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockMessage);
    });
  });

  describe('GET /messages/unread', () => {
    it('should get unread message count successfully', async () => {
      const mockMessages = [1, 2, 3];
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
      });

      mockEq.mockResolvedValue({ data: mockMessages, error: null });

      const response = await request(app)
        .get('/messages/unread')
        .query({ user_id: '123' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ count: 3 });
      expect(mockSelect).toHaveBeenCalledWith('id');
      expect(mockEq).toHaveBeenCalledWith('recipient_id', '123');
      expect(mockEq).toHaveBeenCalledWith('read', false);
    });
  });
});
