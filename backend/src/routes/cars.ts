import { Router, Request, Response, RequestHandler } from 'express';
import { supabase } from '../config/supabase';
import { ApiError, Car } from '../types';
import { FileArray, UploadedFile } from 'express-fileupload';

export const carsRouter = Router();

// Get paginated car listings with filters
carsRouter.get('/', async (req, res) => {
  const { page = 1, limit = 10, ...filters } = req.query;
  const start = (Number(page) - 1) * Number(limit);
  const end = start + Number(limit);

  try {
    let query = supabase
      .from('cars')
      .select('*', { count: 'exact' });

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        query = query.eq(key, value);
      }
    });

    const { data, count, error } = await query
      .range(start, end)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
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
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get detailed car information
carsRouter.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }
    if (!data) {
      return res.status(404).json({ error: 'Car not found' });
    }

    return res.status(200).json(data);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new car listing
carsRouter.post('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('cars')
      .insert([req.body as Car])
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

// Update car listing
carsRouter.put('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('cars')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

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

// Delete car listing
carsRouter.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('cars')
      .delete()
      .eq('id', req.params.id);

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

// Upload car photos
const uploadPhotos: RequestHandler = async (req, res) => {
  try {
    const file = (req.files?.file as UploadedFile) || undefined;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { data, error } = await supabase.storage
      .from('car-photos')
      .upload(`${req.params.id}/${file.name}`, file.data);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({ path: data?.path });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
};

carsRouter.post('/:id/photos', uploadPhotos);

// Delete car photo
carsRouter.delete('/:id/photos/:photoId', async (req, res) => {
  try {
    const { error } = await supabase
      .storage
      .from('car-photos')
      .remove([`${req.params.id}/${req.params.photoId}`]);

    if (error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(204).send();
  } catch (error) {
    const apiError = error as ApiError;
    return res.status(500).json({ error: apiError.message });
  }
});
