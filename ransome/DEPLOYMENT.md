# Deployment Guide

## Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+
- Git

### Quick Start
```bash
# Clone and setup
git clone <repository-url>
cd ransome
chmod +x setup.sh
./setup.sh

# Start backend
cd backend
source venv/bin/activate
python app.py

# Start frontend (new terminal)
cd frontend
npm start
```

## Production Deployment

### Heroku (Backend)

1. **Install Heroku CLI**
```bash
# macOS
brew tap heroku/brew && brew install heroku

# Ubuntu
curl https://cli-assets.heroku.com/install.sh | sh
```

2. **Deploy Backend**
```bash
cd backend
heroku create ransom-detect-api
heroku config:set PYTHONPATH=/app
git init
git add .
git commit -m "Initial commit"
git push heroku main
```

3. **Configure Environment**
```bash
heroku config:set SECRET_KEY=your-secret-key
heroku config:set ALGORITHM=HS256
```

### Vercel (Frontend)

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Deploy Frontend**
```bash
cd frontend
vercel --prod
```

3. **Configure Environment**
- Set `REACT_APP_API_URL` to your Heroku backend URL

### Docker Deployment

1. **Build and Run**
```bash
docker-compose up --build
```

2. **Access Application**
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Environment Variables

### Backend (.env)
```
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DATABASE_URL=sqlite:///./ransom_detect.db
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000
```

## Database Setup

The application uses SQLite by default. For production, consider PostgreSQL:

```python
# In app.py, replace:
SQLALCHEMY_DATABASE_URL = "postgresql://user:password@localhost/ransom_detect"
```

## Monitoring and Logging

### Health Checks
- Backend: `GET /health`
- Frontend: Check if app loads

### Logs
```bash
# Heroku
heroku logs --tail -a ransom-detect-api

# Docker
docker-compose logs -f
```

## Security Considerations

1. **Change Default Secrets**
   - Update `SECRET_KEY` in production
   - Use environment variables for sensitive data

2. **HTTPS**
   - Enable HTTPS in production
   - Update CORS settings for production domains

3. **Rate Limiting**
   - Implement rate limiting for API endpoints
   - Add request validation

## Performance Optimization

1. **Backend**
   - Use Redis for caching
   - Implement connection pooling
   - Add request compression

2. **Frontend**
   - Enable gzip compression
   - Implement code splitting
   - Use CDN for static assets

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Update `allow_origins` in FastAPI CORS middleware
   - Check API URL configuration

2. **Model Training Fails**
   - Ensure sufficient memory
   - Check Python dependencies

3. **WebSocket Connection Issues**
   - Verify WebSocket URL
   - Check firewall settings

### Debug Mode

```bash
# Backend debug
cd backend
python -m debugpy --listen 5678 --wait-for-client app.py

# Frontend debug
cd frontend
npm start
# Open browser dev tools
```