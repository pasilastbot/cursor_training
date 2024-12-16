import request from 'supertest';
import express from 'express';
import { searchRouter } from '../../routes/search';
import { supabase } from '../../config/supabase';
import { redisClient } from '../../config/redis';

jest.mock('../../config/supabase', () => ({
  supabase: {
    from: jest.fn((table: string) => ({
      select: jest.fn().mockReturnThis(),
      textSearch: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis()
    })),
    rpc: jest.fn()
  }
}));

jest.mock('../../config/redis', () => ({
  redisClient: {
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn()
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
        { id: 1, make: 'Toyota', model: 'Camry', year: 2020, price: 25000 },
        { id: 2, make: 'Honda', model: 'Civic', year: 2019, price: 22000 }
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
        {
          id: 1,
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          price: 25000,
          location: 'POINT(-122.4194 37.7749)',
          distance: 5
        }
      ];
      const mockNearbyResponse = {
        data: [{ id: 1, distance: 5 }],
        error: null
      };
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

      (supabase.rpc as jest.Mock)
        .mockResolvedValueOnce(mockNearbyResponse)  // nearby_cars
        .mockResolvedValue(5);  // calculate_distance

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

    it('should handle empty geo search results', async () => {
      const mockNearbyResponse = { data: [], error: null };

      (supabase.rpc as jest.Mock).mockResolvedValue(mockNearbyResponse);

      const response = await request(app)
        .get('/search')
        .query({
          lat: '37.7749',
          lng: '-122.4194',
          radius: '10'
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
      expect(response.body.meta.total).toBe(0);
    });

    it('should search with combined filters successfully', async () => {
      const mockCars = [
        {
          id: 1,
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          price: 25000,
          location: 'POINT(-122.4194 37.7749)'
        }
      ];
      const mockResponse = { data: mockCars, count: 1, error: null };

      const mockSelect = jest.fn().mockReturnThis();
      const mockTextSearch = jest.fn().mockReturnThis();
      const mockGte = jest.fn().mockReturnThis();
      const mockLte = jest.fn().mockReturnThis();
      const mockIlike = jest.fn().mockReturnThis();
      const mockRange = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue(mockResponse);

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        textSearch: mockTextSearch,
        gte: mockGte,
        lte: mockLte,
        ilike: mockIlike,
        range: mockRange,
        order: mockOrder
      });

      const response = await request(app)
        .get('/search')
        .query({
          query: 'Toyota',
          minPrice: '20000',
          maxPrice: '30000',
          minYear: '2018',
          maxYear: '2022',
          make: 'Toyota',
          model: 'Camry'
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
    it('should return cached suggestions if available', async () => {
      const mockCachedSuggestions = [
        { suggestion: 'Toyota Camry', frequency: 10 },
        { suggestion: 'Toyota Corolla', frequency: 8 }
      ];

      (redisClient.get as jest.Mock).mockResolvedValue(JSON.stringify(mockCachedSuggestions));

      const response = await request(app)
        .get('/search/suggestions')
        .query({ query: 'Toyota' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCachedSuggestions);
      expect(redisClient.get).toHaveBeenCalledWith('suggestions:Toyota');
      expect(supabase.rpc).not.toHaveBeenCalled();
    });

    it('should fetch suggestions from database if not cached', async () => {
      const mockSuggestions = [
        { suggestion: 'Toyota Camry', frequency: 10 },
        { suggestion: 'Toyota Corolla', frequency: 8 }
      ];

      (redisClient.get as jest.Mock).mockResolvedValue(null);
      (supabase.rpc as jest.Mock).mockResolvedValue({ data: mockSuggestions, error: null });

      const response = await request(app)
        .get('/search/suggestions')
        .query({ query: 'Toyota' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockSuggestions);
      expect(redisClient.setex).toHaveBeenCalledWith(
        'suggestions:Toyota',
        3600,
        JSON.stringify(mockSuggestions)
      );
    });

    it('should handle suggestions error', async () => {
      const mockError = new Error('Suggestions failed');

      (redisClient.get as jest.Mock).mockResolvedValue(null);
      (supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: mockError });

      const response = await request(app)
        .get('/search/suggestions')
        .query({ query: 'Toyota' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /search/popular', () => {
    it('should return cached popular searches if available', async () => {
      const mockCachedPopular = [
        { query: 'Toyota', count: 100 },
        { query: 'Honda', count: 80 }
      ];

      (redisClient.get as jest.Mock).mockResolvedValue(JSON.stringify(mockCachedPopular));

      const response = await request(app)
        .get('/search/popular');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCachedPopular);
      expect(redisClient.get).toHaveBeenCalledWith('popular_searches');
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should fetch popular searches from database if not cached', async () => {
      const mockPopular = [
        { query: 'Toyota', count: 100 },
        { query: 'Honda', count: 80 }
      ];

      (redisClient.get as jest.Mock).mockResolvedValue(null);
      const mockSelect = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue({ data: mockPopular, error: null });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        order: mockOrder,
        limit: mockLimit
      });

      const response = await request(app)
        .get('/search/popular');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPopular);
      expect(redisClient.setex).toHaveBeenCalledWith(
        'popular_searches',
        3600,
        JSON.stringify(mockPopular)
      );
    });

    it('should handle popular searches error', async () => {
      const mockError = new Error('Popular searches failed');

      (redisClient.get as jest.Mock).mockResolvedValue(null);
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
      expect(response.body).toHaveProperty('error');
    });
  });
});
