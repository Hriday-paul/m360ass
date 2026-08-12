# Vehicle Rental Management Backend

A REST API for a vehicle rental company. Staff authenticate and manage the vehicle fleet; customer bookings are recorded as rentals, with server-side overlap checks so a vehicle can't be double-booked. Includes a monthly revenue/report endpoint.

## Tech Stack

- **Runtime / Language:** Node.js, TypeScript
- **Framework:** Express
- **Database:** PostgreSQL
- **Query Builder:** Knex
- **File Uploads:** Multer (local photo storage)
- **Auth:** JWT
- **Validation:** Express validator
- **Linting/Formatting:** ESLint + Prettier

## Project Structure

```
.
├── public/                     # static assets
├── src/
│   ├── config/                 # env config, knex/db connection setup
│   ├── constants/               # shared constant values
│   ├── db/                      # Knex instance / DB bootstrap
│   ├── error/                   # custom error classes
│   ├── helper/                  # helper/utility functions
│   ├── interface/                # shared TypeScript interfaces
│   ├── middleware/
│   │   ├── auth.ts               # JWT auth middleware
│   │   ├── globalErrorhandler.ts # centralized error handler
│   │   ├── notfound.ts           # 404 handler
│   │   ├── parseData.ts          # request body/multipart parsing
│   │   ├── RateLimiter.ts        # rate limiting
│   │   └── req_validation.ts     # express-validator request validation
│   ├── migrations/               # Knex migrations
│   ├── modules/                  # feature modules (each with its own
│   │   ├── auth/                 #   controller, service, routes, etc.)
│   │   ├── otp/
│   │   ├── rental/
│   │   ├── user/
│   │   └── vehicle/
│   ├── queues/
│   │   ├── email.queue.ts        # background email jobs
│   │   └── s3.queue.ts           # background photo upload jobs (S3)
│   ├── redis/                    # Redis client setup (caching / queues)
│   ├── seeds/                    # Knex seed files
│   ├── shared/                   # shared cross-module code
│   ├── utils/                    # generic utilities
│   ├── workers/                  # queue worker processes
│   ├── types/                    # shared types, Express Request extension
│   ├── index.ts                  # app entrypoint
│   ├── routs.ts                  # top-level route aggregation
│   └── server.ts                 # HTTP server bootstrap
├── .env
├── .gitignore
├── .gitlab-ci.yml
├── firebase.json
├── knexfile.ts
├── package.json
└── tsconfig.json
```

## Prerequisites

- Node.js 18+
- PostgreSQL 13+ running locally or accessible remotely
- npm

## Setup

1. **Clone and install dependencies**

   ```bash
   git clone https://github.com/Hriday-paul/m360ass.git
   cd m360ass
   npm install
   ```

2. **Configure environment variables**

   Copy the example file and fill in your own values:

   ```bash
   cp .env.example .env
   ```

3. **Create the database**

   ```bash
   CREATE DATABASE database_name
   ```

4. **Apply migrations**

   ```bash
   npx knex migrate:latest
   ```

5. **Run seeds**

   Seeds include at least one rental, so the monthly report is testable out of the box.

   ```bash
   npx knex seed:run
   ```

6. **Start the server**

   ```bash
   # development (with reload)
   npm run dev

   # production build
   npm run build
   npm start
   ```

   The API will be available at `http://localhost:5100`.