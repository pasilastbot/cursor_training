import { Router } from 'express';
import { supabase } from '../config/supabase';
import { ApiError, Car, SearchSuggestion, PopularSearch } from '../types';
import { redisClient } from '../config/redis';

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
    minPrice,
    maxPrice,
    minYear,
    maxYear,
    make,
    model,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = req.query;

  try {
    let dbQuery = supabase
      .from('cars')
      .select<string, Car>('*', { count: 'exact' });

    // Apply text search if query exists
    if (query) {
      try {
        // Log search query for suggestions and popular searches
        await Promise.all([
          supabase.from('search_suggestions').insert({ suggestion: query }),
          supabase.rpc('increment_popular_search', { search_query: query })
        ]);

        dbQuery = dbQuery.textSearch('searchable_text', query as string, {
          type: 'websearch',
          config: 'english'
        });
      } catch (error) {
        console.error('Search logging error:', error);
        // Continue with search even if logging fails
      }
    }

    // Apply geo filter if coordinates exist
    if (lat && lng) {
      const { data: nearbyData, error: rpcError } = await supabase.rpc('nearby_cars', {
        user_lat: parseFloat(lat as string),
        user_lng: parseFloat(lng as string),
        radius_km: parseFloat(radius as string)
      });

      if (rpcError) {
        return res.status(400).json({ error: 'Geo search failed' });
      }

      // Filter by nearby car IDs
      if (nearbyData && nearbyData.length > 0) {
        const nearbyIds = nearbyData.map((car: any) => car.id);
        dbQuery = dbQuery.in('id', nearbyIds);
      } else {
        // No cars found in radius
        return res.status(200).json({
          data: [],
          meta: {
            total: 0,
            page: Number(page),
            limit: Number(limit)
          }
        });
      }
    }

    // Apply price filters
    if (minPrice) {
      dbQuery = dbQuery.gte('price', parseFloat(minPrice as string));
    }
    if (maxPrice) {
      dbQuery = dbQuery.lte('price', parseFloat(maxPrice as string));
    }

    // Apply year filters
    if (minYear) {
      dbQuery = dbQuery.gte('year', parseInt(minYear as string));
    }
    if (maxYear) {
      dbQuery = dbQuery.lte('year', parseInt(maxYear as string));
    }

    // Apply make/model filters
    if (make) {
      dbQuery = dbQuery.ilike('make', `%${make}%`);
    }
    if (model) {
      dbQuery = dbQuery.ilike('model', `%${model}%`);
    }

    // Apply sorting
    if (sortBy && sortOrder) {
      dbQuery = dbQuery.order(sortBy as string, { ascending: sortOrder === 'asc' });
    }

    // Apply pagination
    const start = (Number(page) - 1) * Number(limit);
    const end = start + Number(limit);
    dbQuery = dbQuery.range(start, end);

    const { data, count, error } = await dbQuery;

    if (error) {
      return res.status(400).json({ error: 'Search failed' });
    }

    // If geo search was used, add distance to each result
    if (lat && lng && data) {
      const userPoint = `POINT(${lng} ${lat})`;
      data.forEach((car: any) => {
        if (car.location) {
          const distance = supabase.rpc('calculate_distance', {
            point1: userPoint,
            point2: car.location
          });
          car.distance = distance;
        }
      });
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
    console.error('Search error:', error);
    return res.status(400).json({ error: 'Search failed' });
  }
});

// Get search suggestions with caching
searchRouter.get('/suggestions', async (req, res) => {
  const { query } = req.query;

  try {
    // Try to get cached suggestions first
    const cacheKey = `suggestions:${query}`;
    const cachedSuggestions = await redisClient.get(cacheKey);

    if (cachedSuggestions) {
      return res.status(200).json(JSON.parse(cachedSuggestions));
    }

    const { data, error } = await supabase.rpc('get_search_suggestions', {
      search_term: query,
      limit_count: 5
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Cache the suggestions for 1 hour
    await redisClient.setex(cacheKey, 3600, JSON.stringify(data));

    return res.status(200).json(data || []);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get popular searches with caching
searchRouter.get('/popular', async (req, res) => {
  try {
    // Try to get cached popular searches first
    const cacheKey = 'popular_searches';
    const cachedPopular = await redisClient.get(cacheKey);

    if (cachedPopular) {
      return res.status(200).json(JSON.parse(cachedPopular));
    }

    const { data, error } = await supabase
      .from('popular_searches')
      .select<string, PopularSearch>('*')
      .order('count', { ascending: false })
      .limit(10);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Cache the popular searches for 1 hour
    await redisClient.setex(cacheKey, 3600, JSON.stringify(data));

    return res.status(200).json(data || []);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});
