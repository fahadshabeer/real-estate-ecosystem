# Nginx + SSL Setup for Frontend (AWS Ubuntu)

Use this after the frontend container is deploying successfully on port `127.0.0.1:3000`.

## 1) DNS setup

In your domain DNS, add:
- `A` record: `@` -> your AWS public IP
- `A` record: `www` -> your AWS public IP

Wait for DNS propagation.

## 2) Open AWS Security Group ports

Allow inbound:
- `80` (HTTP)
- `443` (HTTPS)
- `22` (SSH)

You no longer need public `3000`.

## 3) Install Nginx and Certbot

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

## 4) Add Nginx site config

On server:

```bash
sudo nano /etc/nginx/sites-available/real-estate-frontend
```

Paste from this repo file:
- `infra/nginx/real-estate-frontend.conf`

Replace:
- `example.com`
- `www.example.com`

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/real-estate-frontend /etc/nginx/sites-enabled/real-estate-frontend
sudo nginx -t
sudo systemctl reload nginx
```

## 5) Issue SSL certificate

```bash
sudo certbot --nginx -d example.com -d www.example.com
```

Choose:
- redirect HTTP to HTTPS: `Yes`

## 6) Verify

```bash
curl -I https://example.com
```

Browser check:
- `https://example.com`
- `https://www.example.com`

## 7) Auto-renew check

```bash
sudo certbot renew --dry-run
```

## 8) Optional hardening

Disable default site:

```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

