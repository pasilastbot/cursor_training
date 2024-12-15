export interface ApiError {
  message: string;
}

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  location: {
    lat: number;
    lng: number;
  };
  photos: string[];
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface Match {
  id: string;
  user_id: string;
  car_id: string;
  status: 'liked' | 'passed';
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  participant1: string;
  participant2: string;
  last_message?: Message;
  created_at: string;
  updated_at: string;
}

export interface SearchSuggestion {
  suggestion: string;
}

export interface PopularSearch {
  query: string;
  count: number;
}
