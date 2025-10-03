# Radio Calico - Internet Radio Station

## Overview
Radio Calico is a web-based internet radio station that streams lossless audio (FLAC/HLS) from a CloudFront CDN. The application features live metadata display, album artwork, song ratings, and a responsive interface matching the official Radio Calico brand guidelines.

## Architecture
- **Backend**: Express.js (v5.1.0) with SQLite database
- **Frontend**: Vanilla JavaScript with HLS.js for audio streaming
- **Database**: SQLite with two tables (users, song_ratings)
- **Audio**: HLS lossless streaming (48kHz FLAC)
- **Metadata**: Polled from JSON endpoint every 10 seconds

## How to Run

### Local Development
```bash
npm install
npm start
```
Server runs on http://localhost:3000

**Important**: Run server in background to avoid blocking terminal. Use `lsof -ti:3000 | xargs kill -9` if port is occupied.

### Docker Deployment

#### Production (recommended for deployment)
```bash
# Using Docker Compose (easiest)
docker-compose up radiocalico-prod -d

# Or build and run manually
docker build -t radiocalico:prod -f Dockerfile .
docker run -d -p 3000:3000 -v radiocalico-data:/app/data --name radiocalico radiocalico:prod
```

#### Development (with hot reload)
```bash
# Using Docker Compose
docker-compose up radiocalico-dev -d

# Or build and run manually
docker build -t radiocalico:dev -f Dockerfile.dev .
docker run -d -p 3001:3000 -v $(pwd):/app --name radiocalico-dev radiocalico:dev
```

#### Docker Management
```bash
# Stop containers
docker-compose down

# View logs
docker-compose logs -f radiocalico-prod

# Rebuild after code changes
docker-compose up --build radiocalico-prod

# Access container shell
docker exec -it radiocalico /bin/sh
```

Production container uses persistent volume for SQLite database at `/app/data/database.sqlite`.

## File Structure
All files must be **≤100 lines** to maintain modularity:
- `server.js` - Express server with SQLite integration and API endpoints (exports app and db for testing)
- `index.html` - Main page structure
- `css/styles.css` - Brand-compliant styling
- `javascript/player.js` - HLS player logic, metadata fetching, rating system
- `package.json` - Dependencies (express, sqlite3) and scripts
- `database.sqlite` - Auto-created SQLite database
- `jest.config.js` - Jest testing configuration
- `tests/backend/` - Backend test suite (6 test files, 41 passing tests)
  - `server-integration.test.js` - Full integration tests (89 lines)
  - `server-errors.test.js` - Error handling tests (98 lines)
  - `server-validation.test.js` - Input validation tests (94 lines)
  - `server-crud-complete.test.js` - Complete CRUD operations (90 lines)
  - `server-routes-complete.test.js` - Route testing (89 lines)
  - `server-edge-cases.test.js` - Edge case scenarios (82 lines)
- **Docker files:**
  - `Dockerfile` - Production container (Alpine, production deps only)
  - `Dockerfile.dev` - Development container (nodemon for hot reload)
  - `docker-compose.yml` - Orchestration for prod/dev services
  - `.dockerignore` - Excludes node_modules, tests, etc.
- `RadioCalicoStyle/` - Brand assets (logo, style guide, layout reference)

## Database Schema

### users table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### song_ratings table
```sql
CREATE TABLE song_ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  song_key TEXT NOT NULL,
  user_id TEXT NOT NULL,
  rating INTEGER NOT NULL,  -- 1 for thumbs up, -1 for thumbs down
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(song_key, user_id)  -- Prevents duplicate votes
)
```

## API Endpoints

### Users (CRUD)
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `POST /users` - Create user (requires name, email)
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Ratings
- `GET /ratings/:songKey` - Get thumbs up/down counts for a song
- `POST /ratings` - Submit/update rating (requires songKey, userId, rating)
  - Uses `ON CONFLICT` to update existing votes instead of creating duplicates

## External Resources
All hosted on CloudFront CDN:
- **Stream URL**: `https://d3d4yli4hf5bmh.cloudfront.net/hls/live.m3u8`
- **Metadata**: `https://d3d4yli4hf5bmh.cloudfront.net/metadatav2.json`
- **Album Art**: `https://d3d4yli4hf5bmh.cloudfront.net/cover.jpg`

### Metadata Format
```json
{
  "artist": "Artist Name",
  "title": "Song Title",
  "album": "Album Name",
  "date": "1983",
  "prev_artist_1": "Previous Artist",
  "prev_title_1": "Previous Title",
  ...  // prev_artist_2-5, prev_title_2-5
}
```

## Key Technical Patterns

### User Identification
- Unique user ID generated on first visit: `user_[random]_[timestamp]`
- Stored in `localStorage` as `radioUserId`
- Used to prevent duplicate song ratings

### Song Keys
- Format: `{artist}_{title}` with special characters removed
- Example: `"The Beatles_Hey Jude"` → `"The_Beatles_Hey_Jude"`
- Used as identifier in song_ratings table

### Metadata Polling
- Fetched immediately on play
- Updates every 10 seconds while playing
- Stops when paused

### Cache Busting
- Album art URL includes timestamp: `cover.jpg?t=${Date.now()}`
- Ensures latest artwork is displayed when track changes

### Rating System
- Users can vote once per song (enforced by UNIQUE constraint)
- Changing vote updates existing record (ON CONFLICT DO UPDATE)
- Button animation confirms vote submission
- Counts fetched after each vote to show updated totals

## Brand Guidelines
Reference: `RadioCalicoStyle/RadioCalico_Style_Guide.txt`

### Colors
- **Mint Green**: #D8F2D5 (backgrounds, accents)
- **Forest Green**: #1F4E23 (buttons, text)
- **Teal**: #38A29D (links, highlights)
- **Cream**: #F5EADA (footer)
- **Charcoal**: #231F20 (primary text)
- **Dark Gray**: #4A4A4A (header, controls)
- **Red**: #E74C3C (year badge)

### Typography
- **Headings**: Montserrat (500, 600, 700)
- **Body**: Open Sans (400, 600)
- **Import**: Google Fonts CDN

### Layout
- Full viewport height using flexbox
- Two-column grid on desktop (album art | track details)
- Single column on mobile/tablet (<1024px)
- Logo in centered header
- Mint green "Previous tracks" section
- Cream footer

### Style Guide
A text version of the styling guide for the webpage is at /Users/ashes/Documents/radiocalico/RadioCalicoStyle/RadioCalico_Style_Guide.txt. The Radio Calico logo is at /Users/ashes/Documents/radiocalico/RadioCalicoStyle/RadioCalicoLogoTM.png

## Development Notes

### Common Issues
1. **Port 3000 occupied**: Kill existing processes with `lsof -ti:3000 | xargs kill -9`
2. **Ratings not working**: Ensure `currentSongKey` is set before allowing votes
3. **Album art not updating**: Cache-busting timestamp must be included in URL
4. **Previous tracks empty**: Click play to trigger metadata fetch

### HLS Playback
- Uses HLS.js for modern browsers
- Falls back to native HLS for Safari/iOS
- Low latency mode enabled for minimal delay

### File Size Limit
**Maximum 100 lines per file** - split large files into:
- HTML structure (index.html)
- Styling (css/styles.css)
- Logic (javascript/player.js)
- Server (server.js)

## Testing

### Test Framework
- **Jest**: Test runner with built-in assertions
- **Supertest**: HTTP assertions for Express endpoints
- **In-memory SQLite**: Tests use `:memory:` database to avoid polluting production DB

### Running Tests
```bash
npm test              # Run all tests (41 passing)
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

### Test Coverage Metrics
**Overall backend coverage** (server.js):
- **Lines**: 78.94% (75 of 95 lines)
- **Branches**: 76.19% (16 of 21 branches)
- **Functions**: 81.81% (9 of 11 functions)
- **Statements**: 78.94% (75 of 95 statements)

### Test Suite Structure
**6 comprehensive test suites** (`tests/backend/`):

1. **server-integration.test.js** (89 lines)
   - Full integration workflows
   - Multi-step user operations
   - End-to-end rating scenarios
   - Static file serving verification

2. **server-errors.test.js** (98 lines)
   - Database error handling
   - Network failure scenarios
   - Invalid SQL operation handling
   - Error response validation

3. **server-validation.test.js** (94 lines)
   - Input validation for all endpoints
   - Missing required fields detection
   - Invalid data type handling
   - Malformed request rejection

4. **server-crud-complete.test.js** (90 lines)
   - Complete CRUD lifecycle for users
   - Create, read, update, delete operations
   - User not found scenarios
   - Email uniqueness enforcement

5. **server-routes-complete.test.js** (89 lines)
   - All API route testing
   - Users endpoints (GET, POST, PUT, DELETE)
   - Ratings endpoints (GET, POST)
   - Response format validation

6. **server-edge-cases.test.js** (82 lines)
   - Duplicate vote prevention
   - Vote switching functionality
   - Empty database handling
   - Special character handling in inputs

### Test Results
**41 passing tests** covering:
- All Users CRUD endpoints (GET, POST, PUT, DELETE)
- All Ratings endpoints (GET counts, POST/update ratings)
- Input validation and error handling
- Database constraint enforcement (UNIQUE, ON CONFLICT)
- Edge cases and boundary conditions
- Static file serving

### Server.js Test Compatibility
Server exports module for testing:
```javascript
module.exports = { app, db };
```

Server starts only when run directly (not during tests):
```javascript
if (require.main === module) {
  app.listen(PORT, () => { ... });
}
```

## Logo and Assets
- Logo: `RadioCalicoStyle/RadioCalicoLogoTM.png` (50x50px in header)
- Layout reference: `RadioCalicoStyle/RadioCalicoLayout.png`
- Style guide: `RadioCalicoStyle/RadioCalico_Style_Guide.txt`
