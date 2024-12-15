import { Router } from 'express';
import { supabase } from '../config/supabase';
import { ApiError, Message } from '../types';

export const messagesRouter = Router();

// Get user's conversations
messagesRouter.get('/', async (req, res) => {
  const { user_id } = req.query;
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        participants!inner(*),
        last_message:messages(*)
      `)
      .or(`participant1.eq.${user_id},participant2.eq.${user_id}`)
      .order('updated_at', { ascending: false });

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

// Get unread message count
messagesRouter.get('/unread', async (req, res) => {
  const { user_id } = req.query;
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('id')
      .eq('recipient_id', user_id)
      .eq('read', false);

    if (error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(200).json({ count: data?.length || 0 });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get messages in a conversation
messagesRouter.get('/:conversationId', async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const start = (Number(page) - 1) * Number(limit);
  const end = start + Number(limit);

  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', req.params.conversationId)
      .order('created_at', { ascending: false })
      .range(start, end);

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

// Send a message
messagesRouter.post('/:conversationId', async (req, res) => {
  const { user_id, content } = req.body;
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([{
        conversation_id: req.params.conversationId,
        sender_id: user_id,
        content,
        read: false
      } as Message])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Update conversation's updated_at
    const { error: updateError } = await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', req.params.conversationId);

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    return res.status(201).json(data);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark message as read
messagesRouter.put('/:messageId/read', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('id', req.params.messageId)
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
