import request from 'supertest';
import express from 'express';
import { matchesRouter } from '../../routes/matches';
import { supabase } from '../../config/supabase';

jest.mock('../../config/supabase', () => ({
  supabase: {
    from: jest.fn((table: string) => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn()
    }))
  }
}));

const app = express();
app.use(express.json());
app.use('/matches', matchesRouter);

describe('Matches Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /matches/:carId/like', () => {
    it('should like a car successfully', async () => {
      const mockMatch = { id: 1, user_id: '123', car_id: '456', status: 'liked' };
      const mockResponse = { data: mockMatch, error: null };

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue(mockResponse);

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle
      });

      const response = await request(app)
        .post('/matches/456/like')
        .send({ user_id: '123' });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockMatch);
    });

    it('should handle like error', async () => {
      const mockError = new Error('Like failed');

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockRejectedValue(mockError);

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle
      });

      const response = await request(app)
        .post('/matches/456/like')
        .send({ user_id: '123' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Like failed');
    });
  });

  describe('POST /matches/:carId/pass', () => {
    it('should pass on a car successfully', async () => {
      const mockMatch = { id: 1, user_id: '123', car_id: '456', status: 'passed' };
      const mockResponse = { data: mockMatch, error: null };

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue(mockResponse);

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle
      });

      const response = await request(app)
        .post('/matches/456/pass')
        .send({ user_id: '123' });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockMatch);
    });
  });

  describe('GET /matches', () => {
    it('should get user matches successfully', async () => {
      const mockMatches = [
        { id: 1, user_id: '123', car_id: '456', status: 'liked' }
      ];
      const mockResponse = { data: mockMatches, error: null };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockResolvedValue(mockResponse);

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        eq: mockEq
      });

      (mockEq as jest.Mock).mockReturnValue({ eq: mockEq2 });

      const response = await request(app)
        .get('/matches')
        .query({ user_id: '123' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockMatches);
    });
  });

  describe('DELETE /matches/:matchId', () => {
    it('should remove a match successfully', async () => {
      const mockResponse = { error: null };

      const mockDelete = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue(mockResponse);

      (supabase.from as jest.Mock).mockReturnValue({
        delete: mockDelete,
        eq: mockEq
      });

      const response = await request(app).delete('/matches/1');

      expect(response.status).toBe(204);
    });
  });

  describe('GET /matches/recommendations', () => {
    it('should get recommendations successfully', async () => {
      const mockMatches = { data: [{ car_id: '789' }], error: null };
      const mockRecommendations = {
        data: [{ id: '101', brand: 'Toyota' }],
        error: null
      };

      const mockSelect1 = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockResolvedValue(mockMatches);

      const mockSelect2 = jest.fn().mockReturnThis();
      const mockNot = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue(mockRecommendations);

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({
          select: mockSelect1,
          eq: mockEq1
        })
        .mockReturnValueOnce({
          select: mockSelect2,
          not: mockNot,
          limit: mockLimit
        });

      (mockEq1 as jest.Mock).mockReturnValue({ eq: mockEq2 });

      const response = await request(app)
        .get('/matches/recommendations')
        .query({ user_id: '123' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ data: mockRecommendations.data });
    });

    it('should handle recommendations error', async () => {
      const mockError = new Error('Recommendations failed');

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockRejectedValue(mockError);

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        eq: mockEq1
      });

      (mockEq1 as jest.Mock).mockReturnValue({ eq: mockEq2 });

      const response = await request(app)
        .get('/matches/recommendations')
        .query({ user_id: '123' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Recommendations failed');
    });
  });
});
