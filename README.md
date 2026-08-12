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
- **Rate Limit:** Express Rate Limiter
- **Queue:** Bullmq
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
   CREATE DATABASE assesment_m3
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
   npm run dev

   # production build
   npm run build
   npm start
   ```
   
   The API will be available at `http://localhost:5100`

7. **Create a new staff**

   ```bash
   /auth/create # using this rout signup a new account by provide valid request body 

   /auth/verify-otp # then verify the account, using this rout
   
   /auth/login #thenk, login to the account, using this rout
   
   # now can proceed to check all other api routs
   ```

   ## 🔒 Concurrency Handling & Queue-Based Booking Flow
 
> Rental creation and updates are race-condition-safe. Booking checks are funneled through a **BullMQ** queue (backed by Redis, workers under `src/workers/`) instead of relying on a DB transaction alone — so two staff members booking the same vehicle for overlapping dates at the same instant cannot both succeed.
 
**1. Rental booking queue (race-condition protection)**
 
- **New rental (`POST /rentals`):** every booking request is pushed onto the queue instead of being processed inline. The worker picks up jobs one at a time per vehicle, re-runs the overlap check (same vehicle + overlapping date range) against the current DB state, and only then creates the rental. This serializes writes for the same vehicle so two customers can't both win a booking for the same car/date range — the request that loses the race fails the overlap check once its job is processed, instead of slipping through a check-then-insert gap in a parallel request.
- **Update rental (`PUT /rentals/:id`):** only routed through the same queued overlap check when the update actually changes something that affects availability — `vehicle_id`, `start_date`, or `end_date`. Updates that only touch other fields (e.g. `customer_name`, `status` housekeeping) skip the queue and are applied directly, since they can't create a scheduling conflict.
**2. Email notification queue**
 
- **On successful booking or update:** an email job is queued (`queues/email.queue.ts`) to notify the requesting staff member that the rental was created/updated successfully.
- **On failed booking:** if a queued rental job is rejected (e.g. it lost the race to an overlapping booking), a separate email job is queued to notify the requesting staff member that the rental attempt failed, along with the reason.
Sending mail through the queue — rather than inline in the request handler — keeps the HTTP response fast and decouples notification delivery from the booking flow, so a slow or failing mail provider can't block or fail a booking request.