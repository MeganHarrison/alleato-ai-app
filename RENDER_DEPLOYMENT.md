# Render Deployment Quick Start Guide

## ✅ Issues Fixed

1. **Requirements.txt Encoding Issue**: Fixed UTF-16 encoding that was preventing pip installations
2. **Dynamic PORT Binding**: Updated to use Render's PORT environment variable
3. **Render Blueprint Configuration**: Created render.yaml for automated deployment
4. **Health Check Endpoint**: Ensured /health endpoint works with dynamic ports

## 🚀 Quick Deployment Steps

### 1. Prepare Your Repository

```bash
# Ensure you're in the 6_Agent_Deployment directory
cd 6_Agent_Deployment

# Run the configuration script (optional - for custom domains)
python configure_render.py

# Commit all changes
git add .
git commit -m "Configure Render deployment"
git push origin main
```

### 2. Deploy to Render

#### Option A: Deploy with Render Blueprint (Recommended)

1. Go to [Render Blueprints](https://dashboard.render.com/blueprints)
2. Click "New Blueprint"
3. Connect your GitHub repository
4. Select the repository containing the `render.yaml` file
5. Review the services to be created
6. Click "Deploy"

#### Option B: Manual Service Creation

If you prefer to deploy just the backend API:

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: dynamous-agent-api
   - **Root Directory**: `6_Agent_Deployment/backend_agent_api`
   - **Runtime**: Docker
   - **Plan**: Starter ($7/month)
   - **Health Check Path**: `/health`
5. Add environment variables (see section below)
6. Click "Create Web Service"

### 3. Configure Environment Variables

Add these required environment variables in Render Dashboard:

```env
# LLM Configuration
LLM_PROVIDER=openai
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=your_openai_api_key
LLM_CHOICE=gpt-4o-mini
VISION_LLM_CHOICE=gpt-4o-mini

# Embedding Configuration
EMBEDDING_PROVIDER=openai
EMBEDDING_BASE_URL=https://api.openai.com/v1
EMBEDDING_API_KEY=your_openai_api_key
EMBEDDING_MODEL_CHOICE=text-embedding-3-small

# Database Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Web Search
BRAVE_API_KEY=your_brave_api_key

# Environment
ENVIRONMENT=production
```

### 4. Verify Deployment

After deployment:

1. Check the deployment logs in Render Dashboard
2. Visit the health endpoint: `https://your-service.onrender.com/health`
3. Test the API: `https://your-service.onrender.com/docs`

## 📝 Key Files Modified

- **`render.yaml`**: Blueprint configuration for all services
- **`backend_agent_api/Dockerfile`**: Updated to use dynamic PORT
- **`backend_agent_api/agent_api.py`**: Modified to read PORT from environment
- **`requirements.txt`**: Fixed encoding from UTF-16 to UTF-8

## 🔧 Troubleshooting Common Issues

### Build Failures

1. **"pip can't read requirements.txt"**: File encoding issue - now fixed
2. **"Port already in use"**: Ensure using PORT env variable - now fixed
3. **"Module not found"**: Check all dependencies are in requirements.txt
4. **"Health check failing"**: Verify /health endpoint is accessible

### Runtime Issues

1. **Service crashes on startup**: Check environment variables are set
2. **API not accessible**: Verify PORT binding is correct
3. **Database connection errors**: Check Supabase credentials
4. **LLM API errors**: Verify API keys and endpoints

### Quick Fixes

```bash
# Test Docker build locally
cd backend_agent_api
docker build -t agent-api-test .
docker run -p 8001:8001 -e PORT=8001 agent-api-test

# Verify requirements.txt encoding
file requirements.txt  # Should show: UTF-8 text

# Check for syntax errors
python -m py_compile agent_api.py
```

## 🎯 Next Steps

1. **Set up custom domains** (if needed):
   - Add CNAME records in your DNS provider
   - Configure custom domains in Render service settings

2. **Enable auto-deploy**:
   - Render automatically deploys on push to main branch
   - Configure branch protection for production safety

3. **Monitor your services**:
   - Set up alerts in Render Dashboard
   - Monitor logs for errors
   - Track performance metrics

4. **Scale as needed**:
   - Upgrade from Starter to Standard plan for more resources
   - Add more instances for high availability

## 💡 Tips for Production

1. **Use environment variable groups** in Render to manage secrets across services
2. **Enable health checks** to ensure service availability
3. **Set up a staging environment** with a separate branch
4. **Configure CORS** properly for your frontend domain
5. **Use Render's private networking** for service-to-service communication

## 📚 Resources

- [Render Documentation](https://docs.render.com)
- [Render Blueprint Spec](https://docs.render.com/blueprint-spec)
- [FastAPI Deployment Guide](https://fastapi.tiangolo.com/deployment/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

## ✨ Success Indicators

Your deployment is successful when:
- ✅ Build completes without errors
- ✅ Health check endpoint returns 200 OK
- ✅ API documentation is accessible at /docs
- ✅ Environment variables are properly loaded
- ✅ Database connection is established
- ✅ LLM API calls are working

---

**Note**: This deployment is configured for the Starter plan ($7/month per service). For production workloads with higher traffic, consider upgrading to Standard or Pro plans.