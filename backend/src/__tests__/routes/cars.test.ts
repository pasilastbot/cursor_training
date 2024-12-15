import request from 'supertest';
import express from 'express';
import { carsRouter } from '../../routes/cars';
import { supabase } from '../../config/supabase';

jest.mock('../../config/supabase', () => ({
  supabase: {
    from: jest.fn((table: string) => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn()
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn()
      }))
    }
  }
}));

const app = express();
app.use(express.json());
app.use('/cars', carsRouter);

describe('Cars Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /cars', () => {
    it('should get paginated car listings', async () => {
      const mockCars = [
        { id: 1, name: 'Toyota Camry' },
        { id: 2, name: 'Honda Civic' }
      ];
      const mockResponse = { data: mockCars, count: 2, error: null };

      const mockSelect = jest.fn().mockReturnThis();
      const mockRange = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue(mockResponse);

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        range: mockRange,
        order: mockOrder
      });

      const response = await request(app).get('/cars?page=1&limit=10');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockCars);
      expect(response.body.meta).toHaveProperty('total', 2);
    });

    it('should handle get cars error', async () => {
      const mockError = new Error('Database error');

      const mockSelect = jest.fn().mockReturnThis();
      const mockRange = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockRejectedValue(mockError);

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        range: mockRange,
        order: mockOrder
      });

      const response = await request(app).get('/cars');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Database error');
    });
  });

  describe('GET /cars/:id', () => {
    it('should get car details', async () => {
      const mockCar = { id: 1, name: 'Toyota Camry' };
      const mockResponse = { data: mockCar, error: null };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue(mockResponse);

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      });

      const response = await request(app).get('/cars/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCar);
    });

    it('should handle car not found', async () => {
      const mockResponse = { data: null, error: null };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue(mockResponse);

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      });

      const response = await request(app).get('/cars/999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Car not found');
    });
  });

  describe('POST /cars', () => {
    it('should create new car listing', async () => {
      const mockCar = { id: 1, name: 'New Car' };
      const mockResponse = { data: mockCar, error: null };

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue(mockResponse);

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle
      });

      const response = await request(app)
        .post('/cars')
        .send({ name: 'New Car' });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockCar);
    });

    it('should handle create car error', async () => {
      const mockError = new Error('Creation failed');

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockRejectedValue(mockError);

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle
      });

      const response = await request(app)
        .post('/cars')
        .send({ name: 'New Car' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Creation failed');
    });
  });

  describe('PUT /cars/:id', () => {
    it('should update car listing', async () => {
      const mockCar = { id: 1, name: 'Updated Car' };
      const mockResponse = { data: mockCar, error: null };

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
        .put('/cars/1')
        .send({ name: 'Updated Car' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCar);
    });
  });

  describe('DELETE /cars/:id', () => {
    it('should delete car listing', async () => {
      const mockResponse = { error: null };

      const mockDelete = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue(mockResponse);

      (supabase.from as jest.Mock).mockReturnValue({
        delete: mockDelete,
        eq: mockEq
      });

      const response = await request(app).delete('/cars/1');

      expect(response.status).toBe(204);
    });
  });

  describe('POST /cars/:id/photos', () => {
    it('should upload car photo', async () => {
      const mockResponse = { data: { path: 'photos/1/test.jpg' }, error: null };

      const mockUpload = jest.fn().mockResolvedValue(mockResponse);
      (supabase.storage.from as jest.Mock).mockReturnValue({
        upload: mockUpload
      });

      const response = await request(app)
        .post('/cars/1/photos')
        .attach('file', Buffer.from('test'), 'test.jpg');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('path', 'photos/1/test.jpg');
    });
  });
});
