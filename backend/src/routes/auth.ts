import { Router } from 'express';
import { supabase } from '../config/supabase';
import { ApiError } from '../types';

const router = Router();

// Social login
router.post('/login', async (req, res) => {
  const { provider, access_token } = req.body;
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as any,
      options: {
        queryParams: {
          access_token
        }
      }
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }
    res.json(data);
  } catch (error) {
    const apiError = error as ApiError;
    res.status(400).json({ error: apiError.message });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    const apiError = error as ApiError;
    res.status(400).json({ error: apiError.message });
  }
});

// Get user profile
router.get('/user', async (req, res) => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    res.json(user);
  } catch (error) {
    const apiError = error as ApiError;
    res.status(400).json({ error: apiError.message });
  }
});

// Update user profile
router.put('/user', async (req, res) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      data: req.body
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    const apiError = error as ApiError;
    res.status(400).json({ error: apiError.message });
  }
});

export const authRouter = router;
