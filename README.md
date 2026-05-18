# Mini Lead Distribution System

A highly concurrent, fair, and scalable backend system for allocating leads to service providers. Built as an assignment solution showcasing production-level backend engineering.

## Architecture

- **Framework**: Next.js 14+ (App Router)
- **Database**: MongoDB (Mongoose ODM)
- **Real-time Updates**: Server-Sent Events (SSE)
- **Styling**: Tailwind CSS

The system is organized to separate concerns clearly:
- `src/models`: Database schemas and models.
- `src/services`: Core business logic (e.g., `leadDistributor.ts`).
- `src/app/api`: REST API routes acting as controllers.
- `src/app`: Frontend pages and components.

## Concurrency Handling & Transaction Isolation

Handling concurrent requests safely is the most critical requirement for this system.
1. **MongoDB Transactions**: The core lead distribution logic inside `leadDistributor.ts` is wrapped in an ACID MongoDB Session Transaction (`session.startTransaction()`). If any failure or constraint violation occurs mid-allocation, the transaction safely aborts.
2. **Optimistic Locking via Atomic Updates**: To respect quotas without reading stale data (which causes race conditions), the system NEVER does `read -> modify -> write`. Instead, it uses `findOneAndUpdate` with a condition `$expr: { $lt: ['$usedQuota', '$monthlyQuota'] }`. This enforces the quota constraint at the database level automatically.
3. **Unique Compound Indexes**: 
   - `LeadSchema`: `{ phone: 1, serviceId: 1 }` uniquely prevents duplicate leads.
   - `LeadAssignmentSchema`: `{ leadId: 1, providerId: 1 }` prevents assigning the same provider twice.

## Fairness Algorithm (Rotating Cursor Allocation)

To fairly allocate remaining slots to providers in the pool after mandatory rules apply, a **round-robin** strategy using a cursor is implemented:
- An `AllocationState` document tracks the `currentIndex` per Service.
- Whenever a fair pool needs to be utilized, the system atomically increments this index `findOneAndUpdate({ $inc: { currentIndex: 1 } })`.
- The index is used to determine the starting point in the fair pool: `(startIndex + poolAttempts) % poolSize`.
- This ensures the load is distributed evenly over time, even under concurrent spikes.

## Webhook Idempotency

The endpoint `POST /api/webhooks/subscription-renewed` is fully idempotent.
- It uses a `WebhookEvent` collection with a unique index on `eventId`.
- When an event is received, it attempts to insert using `$setOnInsert` and `upsert: true`.
- If the document already existed (returned true), it means it was previously processed, and it skips the execution gracefully. This guarantees that calling the webhook multiple times for the same event will only reset the quota ONCE.

## Setup Instructions

1. **Clone the repository.**
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure Environment Variables:**
   Create a `.env` file in the root directory based on `.env.example`:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/leaddb?retryWrites=true&w=majority
   ```
4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   *Note: On the first connection, the system will automatically seed the database with 3 Services and 8 Providers.*

5. **Test the System:**
   - Go to `http://localhost:3000/dashboard` to view real-time assignments.
   - Go to `http://localhost:3000/request-service` to submit leads manually.
   - Go to `http://localhost:3000/test-tools` to run concurrent stress tests or simulate webhooks.

## Deployment Notes

- For Vercel, ensure you add the `MONGODB_URI` environment variable.
- Server-Sent Events (SSE) `/api/events` is configured as `force-dynamic` to work with serverless functions seamlessly without requiring heavy long-polling or WebSockets.
