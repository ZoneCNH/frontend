# Frontend Deployment (nginx static)

- Target: jp1 (84.247.154.45)
- Path: /opt/frontend/

## Build

```bash
cd /home/frontend
pnpm build
# → dist/ (static files)
```

## Deploy

```bash
# Copy to server
scp -r dist/* jp1:/opt/frontend/
# Reload nginx
ssh jp1 sudo systemctl reload nginx
```

## nginx config

```nginx
# /etc/nginx/sites-enabled/frontend.conf
server {
    listen 443 ssl;
    server_name dashboard.zonecnh.internal;

    ssl_certificate     /etc/ssl/certs/dashboard.pem;
    ssl_certificate_key /etc/ssl/private/dashboard.key;

    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header Referrer-Policy strict-origin-when-cross-origin;

    location /api/   { proxy_pass http://127.0.0.1:8090; }
    location /healthz { proxy_pass http://127.0.0.1:8090; }
    location /readyz  { proxy_pass http://127.0.0.1:8090; }
    location /metrics { proxy_pass http://127.0.0.1:8090; }

    root /opt/frontend;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## One-liner

```bash
cd /home/frontend && pnpm build && scp -r dist/* jp1:/opt/frontend/ && ssh jp1 sudo systemctl reload nginx
```
