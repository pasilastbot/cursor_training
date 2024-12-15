import request from 'supertest';
import express from 'express';
import { authRouter } from '../auth';
import { supabase } from '../../config/supabase';

const app = express();
app.use(express.json());
app.use('/auth', authRouter);

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockResponse = { data: { user: { id: '123' } }, error: null };
      (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/auth/login')
        .send({ provider: 'google', access_token: 'valid_token' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse.data);
    });

    it('should handle login error', async () => {
      const mockError = { error: { message: 'Invalid credentials' } };
      (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue(mockError);

      const response = await request(app)
        .post('/auth/login')
        .send({ provider: 'google', access_token: 'invalid_token' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /auth/logout', () => {
    it('should successfully logout', async () => {
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

      const response = await request(app).post('/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Logged out successfully' });
    });

    it('should handle logout error', async () => {
      const mockError = { error: { message: 'Logout failed' } };
      (supabase.auth.signOut as jest.Mock).mockResolvedValue(mockError);

      const response = await request(app).post('/auth/logout');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /auth/user', () => {
    it('should return user profile', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: mockUser }, error: null });

      const response = await request(app).get('/auth/user');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUser);
    });

    it('should handle error when fetching user profile', async () => {
      const mockError = { error: { message: 'User not found' } };
      (supabase.auth.getUser as jest.Mock).mockResolvedValue(mockError);

      const response = await request(app).get('/auth/user');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
});
