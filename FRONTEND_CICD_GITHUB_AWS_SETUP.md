# Frontend CI/CD (Docker + AWS Ubuntu + GitHub Actions)

This repo now has frontend-only workflows:

- `.github/workflows/frontend-ci.yml`
- `.github/workflows/frontend-deploy-aws.yml`

## What happens

1. `frontend-ci.yml`
- On push/PR: installs deps + runs `npm run build`

2. `frontend-deploy-aws.yml`
- On `main` push (frontend files) or manual trigger
- Builds Docker image from root `Dockerfile`
- Pushes image to GHCR
- SSH deploys to AWS Ubuntu
- Recreates frontend container
- Verifies service health on localhost

## Required GitHub Secrets

Add these in `Repo Settings -> Secrets and variables -> Actions`.

Required:
- `FRONTEND_AWS_HOST`
- `FRONTEND_AWS_USER` (usually `ubuntu`)
- `FRONTEND_AWS_SSH_KEY`
- `GHCR_READ_TOKEN` (PAT with `read:packages`; add `repo` for private repo/package)
- `FRONTEND_NEXT_PUBLIC_API_BASE_URL` (example: `https://your-backend-api-domain.com`)

Optional:
- `GHCR_USERNAME` (defaults to repository owner if omitted)
- `FRONTEND_AWS_APP_DIR` (default: `/opt/real-estate/frontend`)
- `FRONTEND_AWS_CONTAINER_NAME` (default: `real-estate-frontend`)
- `FRONTEND_AWS_HOST_PORT` (default: `3000`)
- `FRONTEND_AWS_CONTAINER_PORT` (default: `3000`)
- `FRONTEND_AWS_HEALTH_PATH` (default: `/`)

## One-time AWS server setup

Install Docker on Ubuntu and prepare deploy directory:

```bash
sudo mkdir -p /opt/real-estate/frontend
sudo chown -R $USER:$USER /opt/real-estate/frontend
```

Note: Deploy workflow binds container as `127.0.0.1:<host_port>:3000` (localhost only), which is intended for Nginx reverse proxy.

Optional runtime env file on server:

```bash
cd /opt/real-estate/frontend
nano .env
```

Note: `NEXT_PUBLIC_API_BASE_URL` is baked at image build time from GitHub secret `FRONTEND_NEXT_PUBLIC_API_BASE_URL`.

## Deploy

1. Push to `main`
2. Open `Actions` tab
3. Run/verify `Frontend Deploy (AWS Ubuntu)`

## Nginx + SSL (recommended)

Use:
- `FRONTEND_NGINX_SSL_AWS.md`

Nginx config template:
- `infra/nginx/real-estate-frontend.conf`

## Quick checks on server

```bash
docker ps
docker logs --tail=100 real-estate-frontend
curl -i http://127.0.0.1:3000/
```
