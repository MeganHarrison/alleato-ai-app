# Render.com Deployment Guide

This guide covers deploying your Dynamous AI Agent to Render.com using their Blueprint feature for automated infrastructure provisioning and deployment. Render provides a modern Platform-as-a-Service (PaaS) that handles Docker containerization, SSL certificates, and domain management automatically.

## Prerequisites

- A Render.com account
- A GitHub account for repository hosting
- Supabase project
- Google Drive Account and Service Account for RAG
- LLM API Key
- Brave API Key

A new Supabase project and new API keys are recommended for production.

## Understanding Render Deployment

Render uses a Blueprint system that reads your `render.yaml` configuration file to automatically provision and deploy multiple services. This approach provides several advantages:

- **Infrastructure as Code**: Your entire deployment configuration is version-controlled
- **Automatic SSL**: HTTPS certificates are managed automatically for all custom domains
- **Environment Management**: Organized environment variable groups for each service
- **Automatic Deploys**: Services redeploy automatically when you push code changes

The deployment will create three services:
- **Frontend** (Node.js): React application served via static hosting
- **Agent API** (Docker): FastAPI server handling AI agent requests
- **RAG Pipeline** (Docker): Background worker processing documents

**Cost**: Both backend services runs on Render's Starter plan ($7/month per service), totaling $14/month for the complete deployment. The static site deployment with the global CDN for the frontend is free.

## Step 1: Set Up Your Repository

Since Render deploys from your own GitHub repository and you'll need to customize the configuration files, you must create your own repository with the code:

1. **Get the Code**:
   - Download the code as a ZIP file from the AI Agent Mastery course
   - Or copy the contents from your course materials

2. **Create Your Repository**:
   ```bash
   # Create a new repository on GitHub (via web interface)
   # Then clone it locally
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   cd YOUR_REPO_NAME
   
   # Copy the AI Agent code into this directory
   # Then add and commit the files
   git add .
   git commit -m "Initial commit with AI Agent code"
   git push origin main
   ```

## Step 2: Configure Domains and Generate Render Configuration

The configuration script automates the process of setting up your custom domains and generating the necessary configuration files for Render deployment.

### Run the Configuration Script

```bash
# Make sure you're in the root directory of your repository
python start_configuration.py
```

The script will guide you through:

1. **Frontend Domain Setup**: Choose between root domain (e.g., `myapp.com`) or subdomain (e.g., `chat.myapp.com`)
2. **API Domain Configuration**: The script will suggest an appropriate API domain or let you specify a custom one
3. **DNS Instructions**: Provides specific DNS record configurations based on your domain choices
4. **File Generation**: Creates `render.yaml` and blueprint environment files

### Domain Configuration Examples

**Root Domain Setup**:
- Frontend: `myapp.com` + `www.myapp.com`
- API: `api.myapp.com`
- DNS: CNAME records for `@`, `www`, and `api`

**Subdomain Setup**:
- Frontend: `chat.myapp.com`
- API: `api.myapp.com`
- DNS: CNAME records for `chat` and `api`

### Generated Files

The script creates several files you'll use in deployment:
- **render.yaml**: Main Blueprint configuration
- **blueprints/frontend-env.env**: Environment variables for frontend service
- **blueprints/agent-api-env.env**: Environment variables for agent API service
- **blueprints/rag-pipeline-env.env**: Environment variables for RAG pipeline service

## Step 3: Configure Environment Variables

Edit the generated environment files in the `blueprints/` directory, replacing placeholder values with your actual configuration:

### Frontend Environment (blueprints/frontend-env.env)
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Agent API Configuration  
VITE_AGENT_ENDPOINT=https://api.yourdomain.com/api/pydantic-agent

# Features
VITE_ENABLE_STREAMING=true
```

### Agent API Environment (blueprints/agent-api-env.env)
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

# Web Search Configuration
BRAVE_API_KEY=your_brave_api_key
```

### RAG Pipeline Environment (blueprints/rag-pipeline-env.env)
```env
# Database Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Embedding Configuration (must match Agent API)
EMBEDDING_PROVIDER=openai
EMBEDDING_BASE_URL=https://api.openai.com/v1
EMBEDDING_API_KEY=your_openai_api_key
EMBEDDING_MODEL_CHOICE=text-embedding-3-small

# Environment
ENVIRONMENT=production
```

## Step 4: Set Up Database

Before deploying, configure your Supabase database with the required tables and functions:

1. **Access Supabase Dashboard**: Go to your Supabase project dashboard
2. **Open SQL Editor**: Navigate to the SQL Editor in the left sidebar
3. **Execute Database Setup**: Run the contents of `sql/0-all-tables.sql` to create all necessary tables, functions, and security policies

**Important**: If using local Ollama with nomic-embed-text, change the vector dimensions from 1536 to 768 in the documents table schema before executing.

## Step 5: Commit and Push Changes

Version control your configuration files and push them to your GitHub repository:

```bash
git add .
git commit -m "Configure Render deployment with domains and environment variables"
git push origin main
```

## Step 6: Configure DNS

Set up DNS records with your domain provider to point your domains to Render's servers. The configuration script provided specific instructions based on your domain setup.

### DNS Record Configuration

The DNS records you need depend on your domain configuration:

**For Root Domain Frontend**:
- Type: CNAME, Name: @, Target: dynamous-frontend.onrender.com
- Type: CNAME, Name: www, Target: dynamous-frontend.onrender.com
- Type: CNAME, Name: api, Target: dynamous-agent-api.onrender.com

**For Subdomain Frontend**:
- Type: CNAME, Name: chat, Target: dynamous-frontend.onrender.com
- Type: CNAME, Name: api, Target: dynamous-agent-api.onrender.com

## Step 7: Deploy via Render Blueprint

Render's Blueprint feature reads your `render.yaml` file and automatically provisions all required services with the correct configuration.

### Create Blueprint Deployment

1. **Navigate to Blueprints**: Go to [https://dashboard.render.com/blueprints](https://dashboard.render.com/blueprints)
2. **Create New Blueprint**: Click "New Blueprint"
3. **Connect GitHub**: Connect your GitHub account if not already linked
4. **Select Repository**: Choose your repository containing the `render.yaml` file
5. **Review Configuration**: Render will display the services it will create based on your Blueprint
6. **Billing Information**: You'll be prompted to enter credit card information if not already on file
7. **Cost Preview**: Review the monthly cost (approximately $21 for three Starter plan services)
8. **Deploy**: Click "Deploy" to begin the deployment process

### Deployment Process

Render will automatically:
- Create three services (frontend, agent-api, rag-pipeline)
- Set up environment variable groups
- Configure custom domains
- Build and deploy each service
- Generate SSL certificates for your domains

## Step 8: Configure Environment Variables

After Blueprint deployment, populate the environment variables using your pre-configured files:

### For Each Environment Group

1. **Navigate to Environment Groups**: Go to [https://dashboard.render.com/env-groups](https://dashboard.render.com/env-groups)
2. **Select Environment Group**: Click on each group (frontend-env, agent-api-env, rag-pipeline-env)
3. **Import from File**: 
   - Click "Add" → "From .env"
   - Copy and paste the contents from your corresponding blueprint file
   - Verify the imported values look correct
   - Save the changes

### Alternative Method

You can also add environment variables individually:
1. Go to each environment group
2. Click "Add Environment Variable"
3. Enter key-value pairs manually from your blueprint files

## Step 9: Redeploy Services

After configuring environment variables, trigger a redeploy to ensure all services use the updated configuration:

1. **Visit Each Service**: Go to your Render dashboard and access each service individually
2. **Trigger Redeploy**: Click "Deploy Latest Commit"
3. **Monitor Logs**: Watch the deployment logs for any errors
4. **Verify Health**: Check that each service starts successfully

## Step 10: Verify Domain Configuration

Once DNS records have propagated, verify that Render recognizes your custom domains:

1. **Check Frontend Service**:
   - Go to Frontend Service → Settings → Custom Domains
   - Verify that your frontend domain shows as "Verified"
   - SSL certificate should be issued automatically

2. **Check Agent API Service**:
   - Go to Agent API Service → Settings → Custom Domains
   - Verify that your API domain shows as "Verified"
   - SSL certificate should be issued automatically

3. **Wait for SSL Certificates**: Certificate issuance can take 5-60 minutes

## Step 11: Testing and Verification

After deployment is complete, test your application:

1. **Access Frontend**: Visit your frontend domain and try talking to the agent to ensure it works
2. **Test Knowledge Base**: Add a document to your knowledge base and verify the agent can reference it in responses

## Optional: Enable CI/CD with Automated Testing

For production deployments, you can configure automatic deployment only after tests pass:

1. **Service Settings**: Go to each service → Settings → Auto-Deploy
2. **CI Integration**: Change value to "After CI Checks Pass"
3. **Test Setup**: Ensure your repository has appropriate GitHub Actions or CI workflows

This ensures deployments only occur when all automated tests are successful.

## Troubleshooting

### Common Issues

**Environment Variables Not Loading**:
- Ensure environment groups are properly configured
- Verify service is linked to correct environment group
- Redeploy service after updating environment variables

**Domain Verification Failing**:
- Check DNS records are correctly configured
- Wait for DNS propagation (up to 24 hours in rare cases)
- Use DNS lookup tools to verify record configuration

**Service Build Failures**:
- Check service logs for specific error messages
- Ensure Docker builds work locally
- Verify all required files are committed to repository

**SSL Certificate Issues**:
- Ensure DNS records point to correct Render targets
- Wait for automatic certificate issuance
- Check domain verification status in service settings

Your Dynamous AI Agent is now fully deployed on Render with custom domains, automatic SSL, and professional infrastructure management!