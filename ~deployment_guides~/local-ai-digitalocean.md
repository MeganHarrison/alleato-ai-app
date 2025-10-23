# Local AI Package - DigitalOcean GPU Deployment Guide

This guide walks you through setting up a secure DigitalOcean GPU droplet for deploying the Local AI Package. This is a prerequisite step before deploying your AI agent in a follow-up video.

## Prerequisites

- A DigitalOcean account with billing information
- Access to the private GitHub repository `dynamous-community/ai-agent-mastery`

### Generate SSH Key Pair (if you don't have one)

On your local machine, generate an SSH key pair:

```bash
ssh-keygen -t rsa -b 4096 -C "any key name"
# Press Enter to accept default file location (~/.ssh/id_rsa)
# Enter a passphrase for added security (optional but recommended)
```

This creates two files  (id_rsa is the default name, you can change this too):
- `~/.ssh/id_rsa` (private key - keep this secure!)
- `~/.ssh/id_rsa.pub` (public key - this gets uploaded to DigitalOcean)

View your public key with:
```bash
cat ~/.ssh/id_rsa.pub
```

## Step 1: Create DigitalOcean GPU Droplet

### Create Your GPU Droplet

1. Go to [digitalocean.com](https://digitalocean.com)
2. Sign up and enter billing information
3. Create a new project or use the default one
4. Click **Create** in the top right → **GPU Droplets** (not regular Droplets!)

### Configure Your GPU Droplet

5. Configure your GPU droplet:
   - **Choose your region**: GPU Droplets are available in New York (NYC2), Atlanta (ATL1), and Toronto (TOR1) data centers
   - **Select Image**: Choose **AI/ML-ready** image (Ubuntu 22.04 with NVIDIA drivers pre-installed)
   - **Choose GPU Plan**: Choose the GPU based on the local LLMs that you want to run
   - **Authentication**: Upload your SSH public key
   - **Hostname**: Give your droplet a descriptive name
   - Click **Create GPU Droplet**

> **Note**: GPU Droplets take longer to initialize than regular droplets, particularly 8 GPU configurations

### Alternative Hosting Options

If you prefer alternatives to DigitalOcean GPU droplets:
- **For GPU requirements**: TensorDock
- **For CPU-only deployment** (if running Ollama separately): Regular DigitalOcean droplets, Hostinger VPS, Hetzner Cloud, or any KVM provider

## Step 2: Initial Server Connection and Security Setup

### Connect to Your Server

```bash
ssh root@[digitalocean-gpu-ip] -i [path-to-your-private-key]
# Example: ssh root@192.168.1.100 -i C:\Users\colem\.ssh\dynamous-key
```

### Configure Basic Firewall

Allow HTTP, HTTPS, and SSH traffic through the firewall:

```bash
ufw enable
ufw allow 80 && ufw allow 443 && ufw allow 22
ufw reload
```

## Step 3: Create Non-Root User and Configure Sudo Access

Following security best practices, we'll create a regular user account instead of using root for daily operations.

### Create New User

```bash
adduser <username>
# Follow prompts to set password and user information
```

### Grant Sudo Privileges

```bash
usermod -aG sudo <username>
```

### Switch to New User

```bash
su - <username>
```

## Step 4: Set Up SSH Key Authentication for New User

This step ensures you can log in as your new user using SSH keys, which is more secure than password authentication.

### Create SSH Directory and Set Permissions

```bash
mkdir .ssh
chmod 700 .ssh
```

### Add Your Public Key

```bash
nano .ssh/authorized_keys
# Paste your public key from the .pub file created on your computer
# Save with Ctrl+X, then Y, then Enter
```

### Secure the authorized_keys File

```bash
chmod 600 .ssh/authorized_keys
```

## Step 5: Disable Root Login (Security Hardening)

This step prevents direct root access via SSH, forcing all users to log in with their own accounts and use `sudo` for administrative tasks.

### Edit SSH Configuration

```bash
sudo nano /etc/ssh/sshd_config
# Find the line: PermitRootLogin yes
# Change it to: PermitRootLogin no
```

### Restart SSH Service

```bash
service ssh restart
```

## Step 6: DNS Configuration (Before Installation)

Set up DNS records to point your service subdomains to your GPU droplet **before** installing the Local AI Package:

Create **A records** for the services you want to expose:
- `supabase.yourdomain.com` → Your droplet IP
- `n8n.yourdomain.com` → Your droplet IP  
- `openwebui.yourdomain.com` → Your droplet IP
- `flowise.yourdomain.com` → Your droplet IP
- `langfuse.yourdomain.com` → Your droplet IP
- `neo4j.yourdomain.com` → Your droplet IP
- `agentapi.yourdomain.com` → Your droplet IP (for AI agent API)
- `chat.yourdomain.com` → Your droplet IP (for AI agent frontend)

This is done through your domain registrar's DNS management interface.

## Step 7: Install Docker Compose

DigitalOcean GPU droplets require Docker Compose to be installed manually. Most of this is specific to DigitalOcean GPU droplets and not needed for regular DigitalOcean droplets with Docker images or some other cloud providers.

```bash
# Get the latest Docker Compose version and install it
DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
sudo curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Set up Docker Compose plugin
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo ln -s /usr/local/bin/docker-compose /usr/local/lib/docker/cli-plugins/docker-compose
```

## Step 8: Add User to the Docker Group

```bash
# Add user to docker group
sudo usermod -aG docker <username>
newgrp docker
```

## Step 9: Install Local AI Package

Follow the complete setup instructions from the [Local AI Package repository](https://github.com/coleam00/local-ai-packaged):

### Clone and Set Up the Repository

```bash
git clone -b stable https://github.com/coleam00/local-ai-packaged.git
cd local-ai-packaged
```

### Configure Environment Variables

```bash
cp .env.example .env
nano .env
```

**Important Configuration Steps:**
1. Generate secure random values for all secrets (never use example values!)
2. Set up Supabase configuration following their [self-hosting guide](https://supabase.com/docs/guides/self-hosting/docker#securing-your-services)
3. Configure Caddy hostnames for production deployment using the subdomains you set up in DNS
4. Set your email for Let's Encrypt SSL certificates

## (Optional): Google Authentication

If you want to enable Google authentication for Supabase, before starting the package add these lines to docker-compose.override-public.yml under services (make sure the tabs align with the other service overrides):

```bash
  auth:
    environment:
     GOTRUE_EXTERNAL_GOOGLE_ENABLED: ${ENABLE_GOOGLE_SIGNUP}
     GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
     GOTRUE_EXTERNAL_GOOGLE_SECRET: ${GOOGLE_CLIENT_SECRET}
     GOTRUE_EXTERNAL_GOOGLE_SKIP_NONCE_CHECK: false
     GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI: ${GOOGLE_REDIRECT_URI}
```

And then be sure in your .env file to specify all of the environment variables in ${...}. GOOGLE_REDIRECT_URI needs to point to the domain for your agent frontend.

### Deploy the Local AI Package

Note: Run 'sudo chmod 777 searxng' beforehand to set the right permissions otherwise the Searxng container will restart. I haven't seen this on every provider but this happens with DigitalOcean GPU droplets for some reason.

For GPU-enabled deployment:

```bash
# For NVIDIA GPUs
python start_services.py --profile gpu-nvidia

# For AMD GPUs  
python start_services.py --profile gpu-amd

# For CPU-only deployment
python start_services.py --profile cpu
```

## Step 10: Deploy AI Agent (Local Integration)

Now that your Local AI Package is running, deploy the AI agent to integrate with the existing services.

### Clone the AI Agent Repository

```bash
git clone https://github.com/dynamous-community/ai-agent-mastery.git
cd ai-agent-mastery/6_Agent_Deployment
```

### Set Up Database

1. **Access your local Supabase dashboard** at https://supabase.yourdomain.com
2. **Log in** using the username and password you set in the Local AI Package `.env` file
3. **Navigate to the SQL Editor**
4. **Run the complete database setup:**
   ```sql
   -- Copy and paste the contents of sql/0-all-tables.sql
   -- This creates all tables, functions, triggers, and security policies
   -- Be sure to adjust the embedding dimensions before running based on your embedding model!
   ```

### Configure Environment Variables

```bash
cp .env.example .env
nano .env
```

**Important**: Ensure the `VITE_AGENT_ENDPOINT` matches your subdomain for your agent (agentapi.yourdomain.com), keeping the `/api/pydantic-agent` path at the end.

**Important Notes:**
- **Docker Network Communication**: Since the AI agent runs in the same Docker network as the Local AI Package, you can reference services by their container names (e.g., `http://supabase:8000`, `http://ollama:11434`)
- **External Access**: Use your configured subdomains (e.g., `https://supabase.yourdomain.com`) to access services from your browser
- **Environment Variables**: Copy the exact keys from your Local AI Package `.env` file for Supabase and langfuse credentials

### Deploy the AI Agent

```bash
# Deploy to integrate with Local AI Package
python deploy.py --type local --project localai
```

### Set Up Caddy Integration

To enable reverse proxy routes for your AI agent through the Local AI Package's Caddy:

1. **Copy the Caddy addon configuration:**
   ```bash
   # Copy to Local AI Package caddy-addon folder
   cp caddy-addon.conf ../../local-ai-packaged/caddy-addon/
   ```

2. **Edit the addon file for your subdomains:**
   ```bash
   cd ../../local-ai-packaged/caddy-addon/
   nano caddy-addon.conf
   # Edit line 2: agentapi.yourdomain.com (for agent API)
   # Edit line 21: agentchat.yourdomain.com (for frontend)
   # These must match the A records you created in Step 6
   ```

3. **Restart Caddy to load the new configuration:**
   ```bash
   docker compose -p localai restart caddy
   ```

### Access Your AI Agent

After setup is complete, access your integrated AI agent:

- **Frontend**: https://agentchat.yourdomain.com
- **Agent API**: https://agentapi.yourdomain.com
- **Health Check**: https://agentapi.yourdomain.com/health

### Add Documents to RAG Pipeline

```bash
# Navigate back to agent deployment directory
cd ../../ai-agent-mastery/6_Agent_Deployment

# Copy documents to the RAG pipeline directory
sudo chmod 777 rag-documents
cp your-documents/* ./rag-documents/
```

## What's Next?

After completing this Local AI Package setup and AI agent integration, you'll have:

- **Ollama** running locally for LLMs
- **Supabase** for database and vector storage
- **n8n** for workflow automation
- **Open WebUI** for chat interface
- **Flowise** for no-code AI agent building
- **langfuse** for LLM observability
- **Neo4j** for graph database
- **RAG Pipeline** for document processing
- **Caddy** handling SSL/TLS automatically
- **AI Agent API** integrated with all local services
- **AI Agent Frontend** accessible via your custom domain

**Complete Integration**: Your AI agent now communicates with all Local AI Package services through the Docker network, providing a fully local AI infrastructure with no external API dependencies.

**Next Steps**: You now have a complete, integrated local AI infrastructure! Your AI agent is running alongside the Local AI Package services and can be accessed through your custom domain with automatic SSL.

## Security Notes

- **Never use the root account** for regular operations after setup
- **SSH key authentication** is more secure than password authentication  
- **Firewall rules** limit access to only necessary ports
- **Non-root user with sudo** provides administrative access when needed
- **Let's Encrypt SSL** automatically secures all your services with HTTPS

## Troubleshooting

If you encounter connection issues after changing SSH settings:
- Always test SSH connection in a **new terminal window** before closing your current session
- Use DigitalOcean's console access if you get locked out
- Verify SSH configuration with: `sudo sshd -T`

For Local AI Package specific issues, refer to the [troubleshooting section](https://github.com/coleam00/local-ai-packaged#troubleshooting) in the repository.