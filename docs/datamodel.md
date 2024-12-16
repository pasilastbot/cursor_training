# CarMatch Data Model

## Database Schema

### Users Table
- id: uuid PRIMARY KEY
- email: text UNIQUE NOT NULL
- full_name: text
- avatar_url: text
- created_at: timestamp with time zone DEFAULT now()
- last_login: timestamp with time zone
- preferences: jsonb (price_range, make, model, year_range, etc)

### Cars Table
- id: uuid PRIMARY KEY
- seller_id: uuid REFERENCES users(id)
- make: text NOT NULL
- model: text NOT NULL
- year: integer NOT NULL
- price: decimal NOT NULL
- mileage: integer
- location: geography(POINT)
- description: text
- status: text (available, sold, pending)
- created_at: timestamp with time zone DEFAULT now()
- updated_at: timestamp with time zone

### CarPhotos Table
- id: uuid PRIMARY KEY
- car_id: uuid REFERENCES cars(id)
- url: text NOT NULL
- order: integer
- created_at: timestamp with time zone DEFAULT now()

### Matches Table
- id: uuid PRIMARY KEY
- user_id: uuid REFERENCES users(id)
- car_id: uuid REFERENCES cars(id)
- status: text (liked, passed)
- created_at: timestamp with time zone DEFAULT now()

### Messages Table
- id: uuid PRIMARY KEY
- sender_id: uuid REFERENCES users(id)
- receiver_id: uuid REFERENCES users(id)
- car_id: uuid REFERENCES cars(id)
- content: text NOT NULL
- read: boolean DEFAULT false
- created_at: timestamp with time zone DEFAULT now()

## Indexes
- users_email_idx ON users(email)
- cars_seller_idx ON cars(seller_id)
- cars_location_idx ON cars USING GIST(location)
- cars_make_model_idx ON cars(make, model)
- matches_user_car_idx ON matches(user_id, car_id)
- messages_participants_idx ON messages(sender_id, receiver_id)

## Row Level Security Policies
- Users can only read/write their own profile data
- Cars can be read by anyone but only modified by seller
- Matches can only be read/written by the matching user
- Messages can only be read/written by conversation participants
