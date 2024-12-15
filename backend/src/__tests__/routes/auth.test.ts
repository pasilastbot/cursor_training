import request from 'supertest';
import express from 'express';
import { authRouter } from '../../routes/auth';
import { supabase } from '../../config/supabase';

const app = express();
app.use(express.json());
app.use('/auth', authRouter);

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/login', () => {
    it('should login user successfully', async () => {
      const mockResponse = { data: { user: { id: '123' } }, error: null };
      (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/auth/login')
        .send({ provider: 'google', access_token: 'token123' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse.data);
    });

    it('should handle login error', async () => {
      const mockError = { message: 'Invalid credentials' };
      (supabase.auth.signInWithOAuth as jest.Mock).mockRejectedValue(mockError);

      const response = await request(app)
        .post('/auth/login')
        .send({ provider: 'google', access_token: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout user successfully', async () => {
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

      const response = await request(app).post('/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Logged out successfully' });
    });

    it('should handle logout error', async () => {
      const mockError = { message: 'Logout failed' };
      (supabase.auth.signOut as jest.Mock).mockRejectedValue(mockError);

      const response = await request(app).post('/auth/logout');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /auth/user', () => {
    it('should get user profile successfully', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const response = await request(app).get('/auth/user');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUser);
    });

    it('should handle get user error', async () => {
      const mockError = { message: 'User not found' };
      (supabase.auth.getUser as jest.Mock).mockRejectedValue(mockError);

      const response = await request(app).get('/auth/user');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /auth/user', () => {
    it('should update user profile successfully', async () => {
      const mockResponse = { data: { user: { id: '123', name: 'Updated' } }, error: null };
      (supabase.auth.updateUser as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app)
        .put('/auth/user')
        .send({ name: 'Updated' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse.data);
    });

    it('should handle update error', async () => {
      const mockError = { message: 'Update failed' };
      (supabase.auth.updateUser as jest.Mock).mockRejectedValue(mockError);

      const response = await request(app)
        .put('/auth/user')
        .send({ name: 'Updated' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
});
