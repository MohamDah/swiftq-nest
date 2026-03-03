# SwiftQ Backend 🚀

A real-time queue management system built with NestJS. Manage customer queues digitally with live updates and push notifications.

## Features

- 🔐 JWT authentication for business hosts
- 📱 Firebase push notifications
- ⚡ Real-time updates via Socket.io
- 🎫 QR code-based queue access
- 📊 Queue analytics and history

## Tech Stack

- NestJS
- PostgreSQL + Prisma
- Firebase Admin SDK
- Passport.js (JWT)
- Swagger/OpenAPI

## Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database and Firebase credentials

# Run migrations
npx prisma migrate dev

# Start development server
npm run start:dev
```

API documentation available at `http://localhost:4000/api`

## Environment Variables

```env
DATABASE_URL=postgresql://myuser:mypassword@localhost:5433/swiftq
DIRECT_URL=postgresql://myuser:mypassword@localhost:5433/swiftq
PORT=4000
JWT_SECRET=my-jwt-secret
JWT_EXPIRES_IN=24h
CORS_ORIGINS='["http://localhost:3006"]'
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}
```

## License

UNLICENSED
