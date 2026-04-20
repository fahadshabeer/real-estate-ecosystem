## Local Development

This frontend runs against the separate backend at:

- `../estate_backend`

### Prerequisites

1. Local MongoDB running on `127.0.0.1:27017`
2. Node.js installed

### Env

Frontend `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

Backend `.env` (in `../estate_backend`):

```env
API_PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/estate_backend
MONGODB_DB_NAME=estate_backend
JWT_ACCESS_SECRET=dev-local-secret-change-me
JWT_ACCESS_EXPIRES_IN=7d
```

### Run both apps together

From this frontend directory:

```bash
npm install
npm run dev:all
```

This starts:

- Backend on `http://localhost:4000`
- Frontend on `http://localhost:3000`

### Run separately

Backend:

```bash
cd ../estate_backend
npm install
npm run dev
```

Frontend:

```bash
cd ../real-estate-ecosystem
npm run dev
```
