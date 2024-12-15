import { Router } from 'express';
import { supabase } from '../config/supabase';
import { ApiError, Match } from '../types';

export const matchesRouter = Router();

// Like a car
matchesRouter.post('/:carId/like', async (req, res) => {
  const { user_id } = req.body;
  try {
    const { data, error } = await supabase
      .from('matches')
      .insert([{
        user_id,
        car_id: req.params.carId,
        status: 'liked'
      } as Match])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(201).json(data);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Pass on a car
matchesRouter.post('/:carId/pass', async (req, res) => {
  const { user_id } = req.body;
  try {
    const { data, error } = await supabase
      .from('matches')
      .insert([{
        user_id,
        car_id: req.params.carId,
        status: 'passed'
      } as Match])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(201).json(data);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's matched cars
matchesRouter.get('/', async (req, res) => {
  const { user_id } = req.query;
  try {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        cars (*)
      `)
      .eq('user_id', user_id)
      .eq('status', 'liked');

    if (error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(200).json(data);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove a match
matchesRouter.delete('/:matchId', async (req, res) => {
  try {
    const { error } = await supabase
      .from('matches')
      .delete()
      .eq('id', req.params.matchId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(204).send();
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get personalized car recommendations
matchesRouter.get('/recommendations', async (req, res) => {
  const { user_id } = req.query;
  try {
    // Get user preferences and liked cars
    const { data: userMatches, error: matchesError } = await supabase
      .from('matches')
      .select('car_id')
      .eq('user_id', user_id)
      .eq('status', 'liked');

    if (matchesError) {
      return res.status(400).json({ error: matchesError.message });
    }

    // Get recommended cars based on user's liked cars
    const { data: recommendations, error: recommendationsError } = await supabase
      .from('cars')
      .select('*')
      .not('id', 'in', userMatches?.map(match => match.car_id) || [])
      .limit(10);

    if (recommendationsError) {
      return res.status(400).json({ error: recommendationsError.message });
    }

    return res.status(200).json({ data: recommendations });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});
