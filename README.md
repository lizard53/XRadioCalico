# Radio Calico - Internet Radio Station

A web-based internet radio station streaming lossless audio (FLAC/HLS) from CloudFront CDN with live metadata, album artwork, and song ratings.

## Features

- **Lossless Audio Streaming**: HLS streaming with 48kHz FLAC quality
- **Live Metadata**: Real-time song information updated every 10 seconds
- **Album Artwork**: Dynamic cover art with cache-busting
- **Song Ratings**: Thumbs up/down voting system with SQLite backend
- **Responsive Design**: Mobile-friendly interface matching Radio Calico brand guidelines
- **Previous Tracks**: View the last 5 songs played

## Quick Start

### Local Development

```bash
npm install
npm start
```

Server runs on http://localhost:3000

**Note**: Run server in background to avoid blocking terminal. Use `lsof -ti:3000 | xargs kill -9` if port is occupied.

### Docker Deployment

#### Production (Recommended)

```bash
# Using Docker Compose (easiest)
docker-compose up radiocalico-prod -d

# Or build and run manually
docker build -t radiocalico:prod -f Dockerfile .
docker run -d -p 3000:3000 -v radiocalico-data:/app/data --name radiocalico radiocalico:prod
```

#### Development (Hot Reload)

```bash
# Using Docker Compose
docker-compose up radiocalico-dev -d

# Or build and run manually
docker build -t radiocalico:dev -f Dockerfile.dev .
docker run -d -p 3001:3000 -v $(pwd):/app --name radiocalico-dev radiocalico:dev
```

#### Docker Management

```bash
docker-compose down                          # Stop containers
docker-compose logs -f radiocalico-prod      # View logs
docker-compose up --build radiocalico-prod   # Rebuild after changes
docker exec -it radiocalico /bin/sh          # Access container shell
```

## Tech Stack

- **Backend**: Express.js v5.1.0, SQLite
- **Frontend**: Vanilla JavaScript, HLS.js
- **Audio**: HLS lossless streaming (48kHz FLAC)
- **CDN**: AWS CloudFront
- **Testing**: Jest, Supertest (78.94% coverage, 41 passing tests)

## API Endpoints

### Users (CRUD)
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `POST /users` - Create user (requires name, email)
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Ratings
- `GET /ratings/:songKey` - Get thumbs up/down counts
- `POST /ratings` - Submit/update rating (requires songKey, userId, rating)

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
  UNIQUE(song_key, user_id)
)
```

## Testing

### Run Tests

```bash
npm test                  # Run all tests (41 passing)
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Generate coverage report
```

### Test Coverage

- **Line Coverage**: 78.94%
- **Branch Coverage**: 76.19%
- **Function Coverage**: 81.81%
- **Test Suites**: 6 comprehensive suites
- **Total Tests**: 41 passing tests

All test files comply with the 100-line maximum requirement.

## Project Structure

```
radiocalico/
├── server.js                          # Express server with SQLite
├── index.html                         # Main page structure
├── css/
│   └── styles.css                     # Brand-compliant styling
├── javascript/
│   └── player.js                      # HLS player, metadata, ratings
├── tests/backend/                     # Jest test suite (41 tests)
│   ├── server-integration.test.js     # Integration tests (89 lines)
│   ├── server-errors.test.js          # Error handling (98 lines)
│   ├── server-validation.test.js      # Input validation (94 lines)
│   ├── server-crud-complete.test.js   # CRUD lifecycle (90 lines)
│   ├── server-routes-complete.test.js # Route coverage (89 lines)
│   └── server-edge-cases.test.js      # Edge cases (82 lines)
├── RadioCalicoStyle/                  # Brand assets
│   ├── RadioCalicoLogoTM.png
│   ├── RadioCalico_Style_Guide.txt
│   └── RadioCalicoLayout.png
├── Dockerfile                         # Production container
├── Dockerfile.dev                     # Development container
├── docker-compose.yml                 # Docker orchestration
└── database.sqlite                    # Auto-created SQLite DB
```

## Brand Guidelines

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

## External Resources

All hosted on CloudFront CDN:
- **Stream**: `https://d3d4yli4hf5bmh.cloudfront.net/hls/live.m3u8`
- **Metadata**: `https://d3d4yli4hf5bmh.cloudfront.net/metadatav2.json`
- **Album Art**: `https://d3d4yli4hf5bmh.cloudfront.net/cover.jpg`

## Development Notes

### File Size Limit
All files must be **≤100 lines** to maintain modularity.

### Common Issues
1. **Port 3000 occupied**: `lsof -ti:3000 | xargs kill -9`
2. **Ratings not working**: Ensure `currentSongKey` is set before voting
3. **Album art not updating**: Cache-busting timestamp must be included
4. **Previous tracks empty**: Click play to trigger metadata fetch

## License

Radio Calico™ - All rights reserved.

## Documentation

For detailed technical documentation, see [CLAUDE.md](CLAUDE.md).
