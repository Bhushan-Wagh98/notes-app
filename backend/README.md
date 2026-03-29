# Share Notes — Backend

Real-time collaborative notes API with live editing, user authentication, and admin management.

## Architecture

```
Client (React)
    │
    ├── REST API ──► Express ──► Controllers ──► MongoDB
    │                  │
    └── WebSocket ──► Socket.IO ──► Document Handler ──► MongoDB
```

## Tech Stack

| Category    | Technology                          |
|-------------|-------------------------------------|
| Runtime     | Node.js + TypeScript                |
| Framework   | Express 5                           |
| Database    | MongoDB (Mongoose 8 ODM)            |
| Real-time   | Socket.IO 4                         |
| Auth        | JWT + bcryptjs                      |
| Email       | Nodemailer (Gmail SMTP)             |
| Testing     | Jest + Supertest + mongodb-memory-server |

## Project Structure

```
backend/
├── src/
│   ├── config/            # Environment & database configuration
│   │   ├── db.ts          # MongoDB connection
│   │   └── env.ts         # Centralized env variables
│   ├── controllers/       # Request handling logic
│   │   ├── auth.controller.ts
│   │   └── notes.controller.ts
│   ├── middlewares/        # Auth & authorization
│   │   └── auth.middleware.ts
│   ├── models/            # Mongoose schemas & interfaces
│   │   ├── document.model.ts
│   │   ├── otp.model.ts
│   │   └── user.model.ts
│   ├── routes/            # Route definitions (thin layer)
│   │   ├── auth.routes.ts
│   │   └── notes.routes.ts
│   ├── services/          # External service integrations
│   │   └── email.service.ts
│   ├── socket/            # WebSocket event handlers
│   │   └── document.handler.ts
│   ├── utils/             # Shared helpers
│   │   └── helpers.ts
│   ├── __tests__/         # Test suite
│   │   ├── setup.ts
│   │   ├── auth.test.ts
│   │   ├── helpers.test.ts
│   │   └── notes.test.ts
│   ├── app.ts             # Express app (exported for testing)
│   └── server.ts          # Entry point (HTTP + Socket.IO)
├── .env
├── .gitignore
├── jest.config.js
├── tsconfig.json
├── package.json
├── Procfile
└── README.md
```

## Getting Started

### Prerequisites

- Node.js >= 18
- MongoDB Atlas account or local MongoDB instance

### Installation

```bash
cd backend
npm install
```

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/Notes
PORT=8080
CLIENT_URL=http://localhost:3000
ALLOWED_ORIGINS=https://share-note.netlify.app,http://localhost:3000
JWT_SECRET=<your-jwt-secret>
ADMIN_EMAIL=<admin-email>
SMTP_EMAIL=<smtp-email>
SMTP_PASSWORD=<smtp-app-password>
```

| Variable          | Description                                      |
|-------------------|--------------------------------------------------|
| `MONGO_URI`       | MongoDB connection string                        |
| `PORT`            | Server port (default: 8080)                      |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins                     |
| `JWT_SECRET`      | Secret key for signing JWT tokens                |
| `ADMIN_EMAIL`     | Master admin email (auto-promoted on signup)      |
| `SMTP_EMAIL`      | Gmail address for sending OTP emails             |
| `SMTP_PASSWORD`   | Gmail app password (not your account password)   |

### Running

```bash
# Development (hot reload)
npm run dev

# Production
npm run build
npm start
```

## API Reference

Base URL: `http://localhost:8080`

### Health Check

```
GET /health
→ { "status": "ok" }
```

### Auth Endpoints (`/api/auth`)

| Method | Endpoint           | Auth | Description                |
|--------|--------------------|------|----------------------------|
| POST   | `/send-otp`        | No   | Send signup OTP via email  |
| POST   | `/verify-otp`      | No   | Verify OTP & create account|
| POST   | `/login`           | No   | Login with email/password  |
| POST   | `/forgot-password` | No   | Send password reset OTP    |
| POST   | `/reset-password`  | No   | Reset password with OTP    |
| PUT    | `/profile`         | Yes  | Update first/last name     |
| PUT    | `/change-password` | Yes  | Change password            |

#### Example — Login

```
POST /api/auth/login
Content-Type: application/json

{ "email": "user@example.com", "password": "Test@1234" }

→ 200 { "token": "eyJ...", "email": "user@example.com", "firstName": "Test", "lastName": "User", "isAdmin": false }
→ 401 { "error": "Invalid credentials" }
→ 403 { "error": "Your account has been blocked. Contact admin." }
```

#### Password Requirements

- Minimum 8 characters
- At least 1 uppercase, 1 lowercase, 1 digit, 1 special character

### Notes Endpoints (`/api/notes`)

| Method | Endpoint                            | Auth  | Description            |
|--------|-------------------------------------|-------|------------------------|
| GET    | `/my-notes`                         | Yes   | List user's notes      |
| PATCH  | `/:id/read-only`                    | Yes   | Toggle read-only       |
| PATCH  | `/:id/visibility`                   | Yes   | Toggle private/public  |
| DELETE | `/:id`                              | Yes   | Delete own note        |

### Admin Endpoints (`/api/notes/admin`)

| Method | Endpoint                            | Auth  | Description            |
|--------|-------------------------------------|-------|------------------------|
| GET    | `/users`                            | Admin | List all users         |
| GET    | `/users/:userId/notes`              | Admin | Get user's notes       |
| GET    | `/anonymous-notes`                  | Admin | Get unowned notes      |
| DELETE | `/users/:userId`                    | Admin | Delete user & notes    |
| DELETE | `/notes/:noteId`                    | Admin | Delete any note        |
| PATCH  | `/notes/:noteId/toggle-lock`        | Admin | Toggle note lock       |
| PATCH  | `/users/:userId/toggle-admin`       | Admin | Toggle admin role      |
| PATCH  | `/users/:userId/toggle-block`       | Admin | Toggle user block      |

### Socket.IO Events

Connect to `ws://localhost:8080` with optional auth token:

```js
const socket = io("http://localhost:8080", {
  auth: { token: "eyJ..." }  // optional, for authenticated users
});
```

| Event             | Direction        | Payload                  | Description                    |
|-------------------|------------------|--------------------------|--------------------------------|
| `get-document`    | Client → Server  | `documentId: string`     | Join document room             |
| `load-document`   | Server → Client  | `data, metadata`         | Document content + permissions |
| `send-changes`    | Client → Server  | `delta: object`          | Broadcast editor changes       |
| `receive-changes` | Server → Client  | `delta: object`          | Receive editor changes         |
| `save-document`   | Client → Server  | `data: object`           | Persist document to DB         |
| `access-denied`   | Server → Client  | —                        | Private document, no access    |
| `user-blocked`    | Server → Client  | —                        | User account is blocked        |

#### Document Metadata (load-document)

```json
{
  "isPrivate": false,
  "isReadOnly": false,
  "isLocked": false,
  "isOwner": true,
  "readOnly": false,
  "ownerName": "Test User"
}
```

## Data Models

### User
| Field      | Type    | Description                |
|------------|---------|----------------------------|
| email      | String  | Unique, lowercase          |
| password   | String  | bcrypt hashed              |
| firstName  | String  | Required                   |
| lastName   | String  | Required                   |
| isAdmin    | Boolean | Default: false             |
| isBlocked  | Boolean | Default: false             |

### Document (Note)
| Field      | Type    | Description                |
|------------|---------|----------------------------|
| _id        | String  | Custom string ID           |
| data       | Mixed   | Quill editor delta         |
| ownerId    | String  | User ID (nullable)         |
| title      | String  | Auto-extracted from content|
| isPrivate  | Boolean | Default: false             |
| isReadOnly | Boolean | Default: false             |
| isLocked   | Boolean | Admin lock, default: false |

### OTP
| Field      | Type    | Description                |
|------------|---------|----------------------------|
| email      | String  | Target email               |
| otp        | String  | 6-digit code               |
| createdAt  | Date    | Auto-expires after 5 min   |

## Testing

Tests use **mongodb-memory-server** — no external database required.

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage
```

### Test Coverage

```
File                  | Stmts  | Branch | Funcs  | Lines
----------------------|--------|--------|--------|-------
All files             | 68.28% | 52.24% | 65.71% | 68.87%
app.ts                |  100%  |  100%  |  100%  |  100%
config/               | 27.27% | 43.75% |   50%  | 33.33%
controllers/          | 79.28% | 76.19% | 89.47% | 80.80%
middlewares/          | 94.44% |  100%  |  100%  | 93.75%
models/               |  100%  |  100%  |  100%  |  100%
routes/               |  100%  |  100%  |  100%  |  100%
services/             | 83.33% |  100%  |    0%  |   80%
utils/                |  100%  |  100%  |  100%  |  100%
```

**50 tests** across 3 test suites:
- `helpers.test.ts` — OTP generation & password validation (8 tests)
- `auth.test.ts` — Auth endpoint integration tests (24 tests)
- `notes.test.ts` — Notes & admin endpoint integration tests (18 tests)

## Available Scripts

| Script             | Description                        |
|--------------------|------------------------------------|
| `npm run dev`      | Start dev server with hot reload   |
| `npm run build`    | Compile TypeScript to `dist/`      |
| `npm start`        | Run compiled production build      |
| `npm run clean`    | Remove `dist/` directory           |
| `npm test`         | Run test suite                     |
| `npm run test:coverage` | Run tests with coverage report|

## Deployment

Configured for Heroku via `Procfile`:

```
web: node dist/server.js
```

Deploy steps:
1. `npm run build`
2. Set environment variables on your hosting platform
3. Start with `npm start`
