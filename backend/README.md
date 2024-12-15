# CarMatch Backend

This is the backend service for the CarMatch application, built with Node.js, Express, TypeScript, and Supabase.

## Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Supabase account and project

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment example file:
   ```bash
   cp .env.example .env
   ```
4. Update the `.env` file with your Supabase credentials and other configurations

## Development

Start the development server:
```bash
npm run dev
```

The server will start on http://localhost:3000 with hot-reload enabled.

## Build

Build the project for production:
```bash
npm run build
```

## Testing

Run the test suite:
```bash
npm test
```

## API Documentation

See the [API documentation](../docs/backend.md) for detailed information about available endpoints.

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── middleware/     # Express middleware
├── routes/         # API routes
├── services/       # Business logic
├── types/          # TypeScript type definitions
└── index.ts        # Application entry point
```

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start development server with hot-reload
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run typecheck` - Run TypeScript type checking

## Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `CORS_ORIGIN` - Allowed CORS origin
- `MAX_FILE_SIZE` - Maximum file upload size

## Contributing

1. Create a feature branch
2. Commit your changes
3. Push to the branch
4. Create a Pull Request

## License

This project is licensed under the ISC License.
