
# CarMatch Backend Design

## API Endpoints

### Authentication
- `POST /auth/login` - Social login with Google/Facebook/Apple via Supabase Auth
- `POST /auth/logout` - Logout user and invalidate session
- `GET /auth/user` - Get current user profile
- `PUT /auth/user` - Update user profile and preferences

### Cars
- `GET /cars` - Get paginated car listings with filters
- `GET /cars/{id}` - Get detailed car information
- `POST /cars` - Create new car listing
- `PUT /cars/{id}` - Update car listing
- `DELETE /cars/{id}` - Delete car listing
- `POST /cars/{id}/photos` - Upload car photos
- `DELETE /cars/{id}/photos/{photoId}` - Delete car photo
- `PUT /cars/{id}/photos/reorder` - Reorder car photos

### Matches
- `POST /matches/{carId}/like` - Like a car
- `POST /matches/{carId}/pass` - Pass on a car
- `GET /matches` - Get user's matched cars
- `DELETE /matches/{matchId}` - Remove a match
- `GET /matches/recommendations` - Get personalized car recommendations

### Messages
- `GET /messages` - Get user's conversations
- `GET /messages/{conversationId}` - Get messages in a conversation
- `POST /messages/{conversationId}` - Send a message
- `PUT /messages/{messageId}/read` - Mark message as read
- `GET /messages/unread` - Get unread message count

### Search
- `GET /search` - Search cars with full-text and geo queries
- `GET /search/suggestions` - Get search suggestions
- `GET /search/popular` - Get popular searches

## Backend Components

### Supabase Integration
- PostgreSQL database with PostGIS for location queries
- Row Level Security (RLS) policies for data protection
- Realtime subscriptions for chat messages
- Storage buckets for car photos
- Built-in authentication and user management

### Vercel Edge Functions
- Serverless API endpoints
- Matching algorithm implementation
- Search and filtering logic
- Background jobs for recommendations
- Webhook handlers for notifications

### Core Services
1. **Authentication Service**
   - Social login handling
   - Session management
   - User profile operations

2. **Car Listing Service**
   - CRUD operations for listings
   - Photo management
   - Search and filtering
   - Geo-location features

3. **Matching Service**
   - Like/Pass handling
   - Match recommendations
   - Preference-based filtering
   - Match notifications

4. **Messaging Service**
   - Real-time chat
   - Message persistence
   - Read receipts
   - Push notifications

## Non-Functional Requirements

### Performance
- API response time < 200ms
- Image loading optimization
- Efficient pagination
- Caching strategies

### Scalability
- Horizontal scaling via Supabase
- CDN for static assets
- Database query optimization
- Connection pooling

### Security
- JWT authentication
- Data encryption
- Input validation
- Rate limiting
- CORS policies

### Reliability
- Error handling
- Data backups
- Monitoring
- Logging
- Health checks

### Maintainability
- API versioning
- Documentation
- Code standards
- Testing coverage
