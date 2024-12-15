import { Request, Response } from 'express';
import { requireAuth } from '../auth';
import { supabase } from '../../config/supabase';

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
  });

  it('should return 401 if no authorization header', async () => {
    await requireAuth(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'No authorization header',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 401 if no token provided', async () => {
    mockRequest.headers = { authorization: 'Bearer ' };

    await requireAuth(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'No token provided',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 401 if invalid token', async () => {
    mockRequest.headers = { authorization: 'Bearer invalid_token' };
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token' },
    });

    await requireAuth(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Invalid token',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should call next() if valid token', async () => {
    mockRequest.headers = { authorization: 'Bearer valid_token' };
    const mockUser = { id: '123', email: 'test@example.com' };
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    await requireAuth(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockRequest.user).toEqual(mockUser);
    expect(nextFunction).toHaveBeenCalled();
  });
});
