import { Router } from 'express';
import { supabase } from '../config/supabase';
import { ApiError, Car, SearchSuggestion, PopularSearch } from '../types';

export const searchRouter = Router();

// Search cars with full-text and geo queries
searchRouter.get('/', async (req, res) => {
  const {
    query,
    lat,
    lng,
    radius = 50, // Default radius in kilometers
    page = 1,
    limit = 20,
    ...filters
  } = req.query;

  try {
    let dbQuery = supabase
      .from('cars')
      .select<string, Car>('*', { count: 'exact' });

    // Apply full-text search if query exists
    if (query) {
      try {
        dbQuery = dbQuery.textSearch('searchable_text', query as string, {
          type: 'websearch',
          config: 'english'
        });
      } catch (error) {
        return res.status(400).json({ error: 'Search failed' });
      }
    }

    // Apply geo filter if coordinates exist
    if (lat && lng) {
      const { data: nearbyData, error: rpcError } = await supabase.rpc('nearby_cars', {
        lat: parseFloat(lat as string),
        lng: parseFloat(lng as string),
        radius_km: parseFloat(radius as string)
      });

      if (rpcError) {
        return res.status(400).json({ error: 'Search failed' });
      }

      // Filter by nearby car IDs
      if (nearbyData) {
        const nearbyIds = nearbyData.map((car: any) => car.id);
        dbQuery = dbQuery.in('id', nearbyIds);
      }
    }

    // Apply additional filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        dbQuery = dbQuery.eq(key, value);
      }
    });

    const start = (Number(page) - 1) * Number(limit);
    const end = start + Number(limit);

    const { data, count, error } = await dbQuery
      .range(start, end)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: 'Search failed' });
    }

    return res.status(200).json({
      data: data || [],
      meta: {
        total: count || 0,
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    return res.status(400).json({ error: 'Search failed' });
  }
});

// Get search suggestions
searchRouter.get('/suggestions', async (req, res) => {
  const { query } = req.query;
  try {
    const { data, error } = await supabase
      .from('search_suggestions')
      .select<string, SearchSuggestion>('suggestion')
      .textSearch('suggestion', query as string)
      .limit(5);

    if (error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(200).json(data?.map(item => item.suggestion) || []);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get popular searches
searchRouter.get('/popular', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('popular_searches')
      .select<string, PopularSearch>('*')
      .order('count', { ascending: false })
      .limit(10);

    if (error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(200).json(data || []);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});
