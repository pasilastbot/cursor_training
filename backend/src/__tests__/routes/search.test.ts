import request from 'supertest';
import express from 'express';
import { searchRouter } from '../../routes/search';
import { supabase } from '../../config/supabase';

jest.mock('../../config/supabase', () => ({
  supabase: {
    from: jest.fn((table: string) => ({
      select: jest.fn().mockReturnThis(),
      textSearch: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn()
    })),
    rpc: jest.fn()
  }
}));

const app = express();
app.use(express.json());
app.use('/search', searchRouter);

describe('Search Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /search', () => {
    it('should search cars with text query successfully', async () => {
      const mockCars = [
        { id: 1, name: 'Toyota Camry' },
        { id: 2, name: 'Honda Civic' }
      ];
      const mockResponse = { data: mockCars, count: 2, error: null };

      const mockSelect = jest.fn().mockReturnThis();
      const mockTextSearch = jest.fn().mockReturnThis();
      const mockRange = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue(mockResponse);

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        textSearch: mockTextSearch,
        range: mockRange,
        order: mockOrder
      });

      const response = await request(app)
        .get('/search')
        .query({ query: 'Toyota' });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockCars);
      expect(response.body.meta.total).toBe(2);
    });

    it('should search cars with geo query successfully', async () => {
      const mockCars = [
        { id: 1, name: 'Toyota Camry', distance: 5 }
      ];
      const mockNearbyResponse = { data: [{ id: 1 }], error: null };
      const mockResponse = { data: mockCars, count: 1, error: null };

      const mockSelect = jest.fn().mockReturnThis();
      const mockIn = jest.fn().mockReturnThis();
      const mockRange = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue(mockResponse);

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        in: mockIn,
        range: mockRange,
        order: mockOrder
      });

      (supabase.rpc as jest.Mock).mockResolvedValue(mockNearbyResponse);

      const response = await request(app)
        .get('/search')
        .query({
          lat: '37.7749',
          lng: '-122.4194',
          radius: '10'
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockCars);
      expect(response.body.meta.total).toBe(1);
    });

    it('should handle search error', async () => {
      const mockError = new Error('Search failed');

      const mockSelect = jest.fn().mockReturnThis();
      const mockRange = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockRejectedValue(mockError);

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        range: mockRange,
        order: mockOrder
      });

      const response = await request(app)
        .get('/search')
        .query({ query: 'Toyota' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Search failed');
    });
  });

  describe('GET /search/suggestions', () => {
    it('should get search suggestions successfully', async () => {
      const mockSuggestions = [
        { suggestion: 'Toyota Camry' },
        { suggestion: 'Toyota Corolla' }
      ];
      const mockResponse = { data: mockSuggestions, error: null };

      const mockSelect = jest.fn().mockReturnThis();
      const mockTextSearch = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue(mockResponse);

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        textSearch: mockTextSearch,
        limit: mockLimit
      });

      const response = await request(app)
        .get('/search/suggestions')
        .query({ query: 'Toyota' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(['Toyota Camry', 'Toyota Corolla']);
    });

    it('should handle suggestions error', async () => {
      const mockError = new Error('Suggestions failed');

      const mockSelect = jest.fn().mockReturnThis();
      const mockTextSearch = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockRejectedValue(mockError);

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        textSearch: mockTextSearch,
        limit: mockLimit
      });

      const response = await request(app)
        .get('/search/suggestions')
        .query({ query: 'Toyota' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Suggestions failed');
    });
  });

  describe('GET /search/popular', () => {
    it('should get popular searches successfully', async () => {
      const mockPopular = [
        { query: 'Toyota', count: 100 },
        { query: 'Honda', count: 80 }
      ];
      const mockResponse = { data: mockPopular, error: null };

      const mockSelect = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue(mockResponse);

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        order: mockOrder,
        limit: mockLimit
      });

      const response = await request(app)
        .get('/search/popular');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPopular);
    });

    it('should handle popular searches error', async () => {
      const mockError = new Error('Popular searches failed');

      const mockSelect = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockRejectedValue(mockError);

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        order: mockOrder,
        limit: mockLimit
      });

      const response = await request(app)
        .get('/search/popular');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Popular searches failed');
    });
  });
});
