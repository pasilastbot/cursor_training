import dotenv from 'dotenv';

// Load environment variables from .env.test if it exists
dotenv.config({ path: '.env.test' });

// Mock Supabase client
jest.mock('../config/supabase', () => {
  const mockResponse = {
    data: null,
    error: null,
  };

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(mockResponse),
    range: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue(mockResponse),
    textSearch: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
  };

  return {
    supabase: {
      auth: {
        signInWithOAuth: jest.fn().mockResolvedValue(mockResponse),
        signOut: jest.fn().mockResolvedValue(mockResponse),
        getUser: jest.fn().mockResolvedValue(mockResponse),
        updateUser: jest.fn().mockResolvedValue(mockResponse),
      },
      from: jest.fn(() => mockQueryBuilder),
      storage: {
        from: jest.fn(() => ({
          upload: jest.fn().mockResolvedValue(mockResponse),
          remove: jest.fn().mockResolvedValue(mockResponse),
        })),
      },
      rpc: jest.fn().mockResolvedValue(mockResponse),
    },
  };
});
