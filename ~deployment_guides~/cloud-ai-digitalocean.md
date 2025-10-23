# DigitalOcean Docker Deployment Guide

This guide walks you through setting up a secure DigitalOcean droplet and deploying your AI agent Docker Compose stack (frontend, RAG pipeline, and agent API).

## Prerequisites

- A DigitalOcean account with billing information
- Access to the private GitHub repository `dynamous-community/ai-agent-mastery`
- A new Supabase project and new API keys for services like your LLMs is recommended for production

### Generate SSH Key Pair (if you don't have one)

On your local machine, generate an SSH key pair:

```bash
ssh-keygen -t rsa -b 4096 -C "any key name"
# Press Enter to accept default file location (~/.ssh/id_rsa)
# Enter a passphrase for added security (optional but recommended)
```

This creates two files (id_rsa is the default name, you can change this too):
- `~/.ssh/id_rsa` (private key - keep this secure!)
- `~/.ssh/id_rsa.pub` (public key - this gets uploaded to DigitalOcean)

View your public key with:
```bash
cat ~/.ssh/id_rsa.pub
```

## Step 1: Create DigitalOcean Account and Droplet

1. Go to [digitalocean.com](https://digitalocean.com)
2. Sign up and enter billing information
3. Create a new project or use the default one
4. Click **Create** in the top right → **Droplet**
5. Configure your droplet:
   - Choose your preferred region
   - Select **Docker Ubuntu** from the Marketplace for the image
   - Set up SSH key authentication (upload your public key)
   - Give your droplet a hostname
   - Click **Create Droplet**

## Step 2: Initial Server Connection and Security Setup

### Connect to Your Server

```bash
ssh root@[digitalocean-ip] -i [path-to-your-private-key]
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
nano /etc/ssh/sshd_config
# Find the line: PermitRootLogin yes
# Change it to: PermitRootLogin no
```

### Restart SSH Service

```bash
service ssh restart
```

## Step 6: Clone and Set Up Your AI Agent Repository

### Clone the Repository

```bash
git clone https://github.com/dynamous-community/ai-agent-mastery.git
# Enter your GitHub username and password when prompted
```

### Navigate to Deployment Directory

```bash
cd ai-agent-mastery/6_Agent_Deployment
```

### Configure Environment Variables

```bash
cp .env.example .env
nano .env
```

**Important**: Ensure the `VITE_AGENT_ENDPOINT` matches your subdomain for your agent, keeping the `/api/pydantic-agent` path at the end.

## Step 7: DNS Configuration

Set up DNS records to point your domains to your droplet:

- Create **A records** pointing your agent and frontend subdomains to the IP address of your DigitalOcean droplet
- This is typically done through your domain registrar's DNS management interface
- `agentapi.yourdomain.com` → Your droplet IP (for AI agent API)
- `chat.yourdomain.com` → Your droplet IP (for AI agent frontend)

This allows your user to run Docker commands without `sudo`.

### Step 8: Set Up Database

1. Log into your Supabase project (new one recommended for production)
2. **Navigate to the SQL Editor**
3. **Run the complete database setup:**
   ```sql
   -- Copy and paste the contents of sql/0-all-tables.sql
   -- This creates all tables, functions, triggers, and security policies
   -- Be sure to adjust the embedding dimensions based on your embedding model.
   ```

## Step 9: Docker Setup and Deployment

### Add User to Docker Group

```bash
sudo usermod -aG docker <username>
newgrp docker
```

### Deploy Your Application

```bash
python3 deploy.py --type cloud
```

This command will deploy your entire Docker Compose stack including:
- Frontend application
- RAG pipeline
- Agent API

## Security Notes

- **Never use the root account** for regular operations after setup
- **SSH key authentication** is more secure than password authentication
- **Firewall rules** limit access to only necessary ports (80, 443)
- **Non-root user with sudo** provides administrative access when needed while maintaining security

## Troubleshooting

If you encounter connection issues after changing SSH settings:
- Always test SSH connection in a **new terminal window** before closing your current session
- Use DigitalOcean's console access if you get locked out
- Verify SSH configuration with: `sudo sshd -T`

## Next Steps

After deployment:
- Monitor your application logs
- Set up SSL certificates for HTTPS (consider using Certbot/Let's Encrypt)
- Configure backup strategies for your data
- Set up monitoring and alerting


## GitHub Actions SSH Key Setup Guide

### Step 1: Generate SSH Key

Generate a new SSH key **without** a passphrase for GitHub Actions:

```bash
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f ~/.ssh/github_deploy_key
```

Then hit enter to skip adding a passphrase when prompted.

### Step 2: Install Key on Your Server

SSH into your machine with your first key then:

```bash
nano ~/.ssh/authorized_keys
# Paste your public key from the .pub file created for GitHub Actions
# Save with Ctrl+X, then Y, then Enter
```

Test that the key works:

```bash
ssh -i ~/.ssh/github_deploy_key your-username@your-server-ip "echo 'New key works!'"
```

### Step 3: Get Private Key Content

Retrieve the private key content for GitHub Secrets:

```bash
cat ~/.ssh/github_deploy_key
```

**Important:** Copy the **entire content** including the `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----` lines.

---

### Next Steps

1. Add the private key content to your GitHub repository secrets
2. Configure your GitHub Actions workflow with the deployment path, host, and username as well