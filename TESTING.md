# Testing Guide: PostgreSQL Migration

This document outlines the testing procedures and database setup required for the newly migrated PostgreSQL backend on the `postgre` branch.

## Prerequisites

Before starting the server, ensure you have the following installed and running:
- **Node.js** (v18+)
- **PostgreSQL** database (Local or Cloud instance like Supabase/Neon)
- **Redis** server (Required for Rate Limiting middleware)

## Environment Variables

Make sure your `server/.env` file contains the appropriate connection strings:

```env
# PostgreSQL Database URL
DATABASE_URL="postgresql://user:password@localhost:5432/youtube_db?schema=public"

# Redis Server URL
REDIS_URL="redis://localhost:6379"

# Other Secrets
PORT=5000
SECRET_KEY="your-secret-key"
NODE_ENV="development"
GROQ_API_KEY="your-groq-key"
```

## Database Setup

Since we've completely migrated from MongoDB to PostgreSQL via Prisma, you must push the new schema to your empty SQL database.

1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Generate the Prisma Client to ensure TypeScript typings are in sync:
   ```bash
   npx prisma generate
   ```
3. Push the schema to create the tables in PostgreSQL:
   ```bash
   npx prisma db push
   ```
   > **Note:** If you are managing production data in the future, use `npx prisma migrate dev` instead to keep a migration history.

## Starting the Application

Once the database is ready, you can start the development server:

```bash
# In the server directory
npm run dev
```

## Testing Checklist

Since the ORM has been swapped entirely, you should manually verify the following endpoints and features (e.g., using Postman, Thunder Client, or your frontend UI):

### 1. Authentication (`/api/v1/auth`)
- [ ] **Sign Up:** Create a new user. Verify password hashing works.
- [ ] **Sign In:** Login with the newly created user and verify the JWT cookie is set.
- [ ] **Logout:** Verify the authentication cookie is cleared.

### 2. User Interactions (`/api/v1/users`)
- [ ] **Subscribe / Unsubscribe:** Test subscribing to another user's channel. Verify `subscribersCount` increments and decrements correctly.
- [ ] **Subscriptions List:** Verify the `getSubscriptionsVideos` endpoint returns populated video data from subscriptions.

### 3. Video Management (`/api/v1/videos`)
- [ ] **Upload Video:** Test local upload vs YouTube link submission. Verify Prisma handles the relationship between `User` and `Video`.
- [ ] **Like / Dislike:** Interact with a video. Ensure toggling works and updates `likesCount` and `dislikesCount`.
- [ ] **Comments:** Post a new comment. Test replies (nested comments via self-referential relations). 
- [ ] **Search:** Verify standard title/description search queries return correctly from Prisma `contains` filters.

### 4. Watch History & Analytics (`/api/v1/history`)
- [ ] **Save History:** Watch a video for >5 seconds and check if it logs. Watch again and verify `watchCount` increments using the `upsert` logic.
- [ ] **Get History:** Fetch paginated history and verify video details and channels populate properly.
- [ ] **Clear History:** Test the deletion cascade for history items.
- [ ] **LLM Analytics:** Navigate to the analytics dashboard. Verify that the new in-memory aggregation correctly compiles watch time, category, and peak hours, and successfully feeds this to the LLM for recommendations.

## Troubleshooting

- **`P2002: Unique constraint failed`**: Ensure your username/channel names are unique when creating test data.
- **`PrismaClientInitializationError`**: Double-check your `DATABASE_URL` in `.env`. Ensure your PostgreSQL service is running and accessible.
- **Rate Limit Errors (429)**: Ensure Redis is running. If testing repeatedly, you may hit the new API Rate Limiters. Either clear your Redis cache (`redis-cli flushall`) or temporarily increase the threshold in `middlewares/rateLimiter.ts`.
