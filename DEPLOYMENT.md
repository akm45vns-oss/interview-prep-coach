# 🚀 Deployment Guide — Interview Prep Coach

## Option 1: Local Docker (Recommended for Production)

### Prerequisites
- Docker Desktop installed
- Groq API key

### 1. Create `docker-compose.yml`

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    env_file:
      - .env
    volumes:
      - ./backend/uploads:/app/uploads
      - ./backend/interview_coach.db:/app/interview_coach.db

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

### 2. Create `backend/Dockerfile`

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "run.py"]
```

### 3. Create `frontend/Dockerfile`

```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### 4. Deploy

```bash
docker-compose up -d
```

---

## Option 2: Render.com (Free Tier)

### Backend (Web Service)

1. Connect GitHub repo to [Render](https://render.com)
2. Create **Web Service** → Root: `backend/`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables from `.env`

### Frontend (Static Site)

1. Create **Static Site** → Root: `frontend/`
2. Build command: `npm install && npm run build`
3. Publish directory: `dist`
4. Add env: `VITE_API_URL=https://your-backend.onrender.com`

---

## Option 3: Railway.app

```bash
# Install Railway CLI
npm install -g @railway/cli
railway login

# Deploy backend
cd backend
railway up

# Deploy frontend
cd ../frontend
railway up
```

---

## Option 4: VPS (Ubuntu 22.04)

```bash
# Install dependencies
sudo apt update && sudo apt install python3.11 python3-pip nodejs npm nginx -y

# Clone and setup
git clone <repo> /opt/interview-coach
cd /opt/interview-coach

# Backend
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
# Create .env with your credentials

# Run backend with systemd
sudo nano /etc/systemd/system/interview-coach.service
```

```ini
[Unit]
Description=Interview Coach Backend
After=network.target

[Service]
User=www-data
WorkingDirectory=/opt/interview-coach/backend
Environment=PATH=/opt/interview-coach/backend/venv/bin
ExecStart=/opt/interview-coach/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable interview-coach
sudo systemctl start interview-coach

# Frontend
cd /opt/interview-coach/frontend
npm install && npm run build
sudo cp -r dist/* /var/www/html/
```

### Nginx Config

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 120s;
    }
}
```

```bash
sudo nginx -t && sudo systemctl restart nginx
```

---

## Environment Variables Checklist

Before deploying, ensure these are set:

```env
GROQ_API_KEY=gsk_xxx                    # From console.groq.com
SECRET_KEY=use-openssl-rand-hex-32      # Run: openssl rand -hex 32
CORS_ORIGINS=https://your-frontend.com
DATABASE_URL=sqlite+aiosqlite:///./interview_coach.db
DEBUG=false
```

---

## Performance Notes

- **Sentence Transformer model** (~80MB) is downloaded on first run and cached
- **SQLite** works fine for single-server; migrate to PostgreSQL for multi-instance
- **Groq** free tier: 14,400 requests/day — sufficient for development
- **PDF export** runs synchronously; consider background tasks for production

---

## Health Check

```bash
curl http://localhost:8000/health
# {"status": "healthy", "app": "Interview Prep Coach", ...}
```
