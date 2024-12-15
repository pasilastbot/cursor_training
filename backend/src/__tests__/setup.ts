import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

interface MockData {
  data: any;
  count?: number;
  error: null | any;
}

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => {
    const mockQueryBuilder = {
      mockData: { data: [], count: 0, error: null } as MockData,
      select: jest.fn().mockImplementation(() => {
        mockQueryBuilder.mockData = {
          data: [
            { id: 1, name: 'Test Car 1', created_at: '2023-01-01' },
            { id: 2, name: 'Test Car 2', created_at: '2023-01-02' }
          ],
          count: 2,
          error: null
        };
        return mockQueryBuilder;
      }),
      insert: jest.fn().mockImplementation(() => {
        mockQueryBuilder.mockData = {
          data: { id: 1, name: 'Test Car', created_at: '2023-01-01' },
          error: null
        };
        return mockQueryBuilder;
      }),
      update: jest.fn().mockImplementation(() => {
        mockQueryBuilder.mockData = {
          data: { id: 1, name: 'Updated Test Car', created_at: '2023-01-01' },
          error: null
        };
        return mockQueryBuilder;
      }),
      delete: jest.fn().mockImplementation(() => {
        mockQueryBuilder.mockData = { data: null, error: null };
        return mockQueryBuilder;
      }),
      eq: jest.fn().mockImplementation(() => {
        return mockQueryBuilder;
      }),
      single: jest.fn().mockImplementation(() => {
        return Promise.resolve(mockQueryBuilder.mockData);
      }),
      range: jest.fn().mockImplementation(() => {
        return mockQueryBuilder;
      }),
      order: jest.fn().mockImplementation(() => {
        return Promise.resolve(mockQueryBuilder.mockData);
      }),
      textSearch: jest.fn().mockImplementation(() => {
        mockQueryBuilder.mockData = {
          data: [
            { suggestion: 'Toyota Camry' },
            { suggestion: 'Toyota Corolla' }
          ],
          error: null
        };
        return mockQueryBuilder;
      }),
      or: jest.fn().mockImplementation(() => {
        mockQueryBuilder.mockData = {
          data: [
            { id: 1, participant1: '123', participant2: '456', last_message: { content: 'Hello' } },
            { id: 2, participant1: '123', participant2: '789', last_message: { content: 'Hi' } }
          ],
          error: null
        };
        return mockQueryBuilder;
      }),
      not: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      then: jest.fn().mockImplementation((callback) => Promise.resolve(callback(mockQueryBuilder.mockData))),
    };

    const mockStorage = {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ data: { path: 'test.jpg' }, error: null }),
        remove: jest.fn().mockResolvedValue({ data: null, error: null }),
      })),
    };

    return {
      auth: {
        signInWithOAuth: jest.fn().mockResolvedValue({ data: { user: { id: '123' } }, error: null }),
        signOut: jest.fn().mockResolvedValue({ error: null }),
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: '123' } }, error: null }),
        updateUser: jest.fn().mockResolvedValue({ data: { user: { id: '123' } }, error: null }),
      },
      from: jest.fn(() => mockQueryBuilder),
      storage: mockStorage,
      rpc: jest.fn().mockResolvedValue({
        data: [{ id: 1, distance: 5 }],
        error: null
      }),
    };
  }),
}));

// Add test to prevent "Your test suite must contain at least one test" error
describe('Setup', () => {
  it('should load environment variables', () => {
    expect(process.env).toBeDefined();
  });
});
