# Social Ecommerce

Next.js 16 frontend with a structured Express 5, Mongoose and standalone MongoDB backend.

## Local setup

```bash
cp .env.example .env
npm install
npm run db:seed -- --reset
npm run dev:all
```

Frontend runs at `http://localhost:3000`; the backend defaults to `http://localhost:5000`. The backend fails fast when MongoDB or required production configuration is unavailable. Prisma and MongoDB transactions are not used.

## Environment

- `MONGODB_URI`: MongoDB connection; legacy `DATABASE_URL` remains accepted during rollout.
- `JWT_SECRET`: required in production and must contain at least 32 characters.
- `BACKEND_PORT`: Express port.
- `BACKEND_URL`: private URL used by Next.js server rendering and rewrites.
- `PUBLIC_API_URL`: browser-reachable backend URL used in uploaded media links.
- `NEXT_PUBLIC_API_URL`: browser API base URL, embedded during `next build`.
- `FRONTEND_URL`: comma-separated exact CORS origins.
- `UPLOAD_DIR`: persistent backend-owned media directory.
- `COOKIE_SECURE`: use `true` with HTTPS and `false` for an HTTP-only deployment.

Example cloud values:

```env
MONGODB_URI="mongodb://127.0.0.1:27017/socialecommerce"
JWT_SECRET="a-long-random-production-secret-value"
BACKEND_PORT=4000
BACKEND_URL="http://127.0.0.1:4000"
PUBLIC_API_URL="http://187.127.141.214:4000"
NEXT_PUBLIC_API_URL="http://187.127.141.214:4000"
FRONTEND_URL="http://187.127.141.214:3000"
UPLOAD_DIR="/root/socialecommerce/uploads"
COOKIE_SECURE=false
```

Public variables must be present before `npm run build`.

## Production with PM2

```bash
npm ci
npm run build
npm run db:seed -- --reset   # only for a fresh database
pm2 start npm --name social-backend -- run start:backend
pm2 start npm --name social-frontend -- start -- -p 3000
pm2 save
```

Do not run the destructive seed against an existing production database. Keep `UPLOAD_DIR` on persistent storage and back it up with MongoDB.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
curl http://127.0.0.1:4000/health
```

The API retains `/api/v1` routes and the `{ success, data, error, meta }` envelope. Checkout accepts an optional `Idempotency-Key` header and uses atomic stock reservations plus stale-attempt recovery, so standalone MongoDB is supported.
