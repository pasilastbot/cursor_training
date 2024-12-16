# CarMatch Frontend Design

## Overall Style & Theme
- Modern, clean interface with focus on car images
- Card-based UI similar to dating apps
- Primary colors: Deep blue (#1E3D59), White (#FFFFFF), Accent orange (#FF9E2C)
- Minimalist design with emphasis on swipe interactions
- Smooth animations and transitions
- Responsive layout adapting to mobile and web

## Views

### Authentication Views
1. **Welcome Screen**
   - Social login buttons (Google, Facebook, Apple)
   - App logo and tagline
   - Background showcasing featured cars

2. **Onboarding**
   - Multi-step preference setup
   - Car preferences (make, model, year range)
   - Price range selection
   - Location settings
   - Buying/Selling role selection

### Main Views
1. **Car Discovery (Home)**
   - Large card stack showing car images
   - Basic info overlay (price, make, model, year)
   - Swipe right to like, left to pass
   - Bottom buttons for undo, like, and pass
   - Distance and key specs visible

2. **Car Details**
   - Full-screen image gallery
   - Detailed specifications
   - Price and location
   - Seller information
   - Contact/Message button
   - Similar cars suggestions

3. **Matches**
   - Grid view of matched cars
   - Filter and sort options
   - Quick access to conversations
   - Price tracking indicators
   - Save/unsave functionality

4. **Messages**
   - Conversation list with recent messages
   - Unread message indicators
   - Car thumbnail in chat
   - Real-time message updates
   - Typing indicators

5. **Profile & Settings**
   - User profile information
   - Preference management
   - Notification settings
   - Account settings
   - Help and support

### Seller Views
1. **Car Listing Creation**
   - Step-by-step listing process
   - Photo upload with reordering
   - Car details form
   - Pricing suggestions
   - Preview functionality

2. **Seller Dashboard**
   - Active listings management
   - Interested buyer statistics
   - Message center
   - Listing performance metrics

## Navigation
- Bottom tab navigation for main sections
- Swipe gestures for card navigation
- Pull-to-refresh for content updates
- Modal views for detailed information
- Back gestures and buttons

## Components
- **CarCard**: Main swipeable card component
- **ImageGallery**: Photo carousel/gallery
- **MatchBadge**: New match notifications
- **ChatBubble**: Message display component
- **FilterPanel**: Search and filter interface
- **PriceTag**: Stylized price display
- **ActionButtons**: Like/Pass/Message buttons
- **PreferenceControls**: Settings toggles and sliders

## Responsive Design
- Mobile-first approach
- Adaptive layouts for tablet/desktop
- Maintained swipe functionality on web
- Grid views for larger screens
- Optimized touch targets for mobile

## Loading States
- Skeleton screens for content loading
- Smooth image loading transitions
- Pull-to-refresh indicators
- Infinite scroll implementations
- Optimistic UI updates

## Error Handling
- Friendly error messages
- Retry mechanisms
- Offline mode indicators
- Data recovery options
- Connection status alerts
