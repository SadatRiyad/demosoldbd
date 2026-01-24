# sold.bd API (Express)

This folder contains the Node/Express backend intended to be deployed to `https://api.sold.bd`.

It matches the frontend's existing API contract (`/api/*`) used when `VITE_API_MODE=node`.

## Runtime requirements

- Node.js 18+
- Hostinger MySQL credentials in environment variables

## Environment variables

Required:

- `HOSTINGER_MYSQL_HOST`
- `HOSTINGER_MYSQL_PORT`
- `HOSTINGER_MYSQL_USER`
- `HOSTINGER_MYSQL_PASSWORD`
- `HOSTINGER_MYSQL_DATABASE`

Security:

- `JWT_SECRET` (long random string)
- `ADMIN_BOOTSTRAP_TOKEN` (same token you already use in Lovable Cloud)

Optional:

- `HOSTINGER_MYSQL_SSLMODE` (`DISABLED` to disable TLS; otherwise TLS is enabled when supported)
- `CORS_ORIGIN` (e.g. `https://sold.bd`)
- `PORT` (default `3000`)

## Run locally

```bash
bun install
bun run server
```

Then set your frontend `.env` (locally) to:

```bash
VITE_API_MODE=node
VITE_NODE_API_BASE_URL=http://localhost:3000
```
