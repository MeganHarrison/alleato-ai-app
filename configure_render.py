#!/usr/bin/env python3
"""
Render Deployment Configuration Script
This script helps configure your Render deployment by setting up domains and generating environment files.
"""

import os
import sys
from pathlib import Path


def create_blueprints_directory():
    """Create the blueprints directory if it doesn't exist."""
    blueprints_dir = Path("blueprints")
    blueprints_dir.mkdir(exist_ok=True)
    return blueprints_dir


def get_domain_configuration():
    """Interactive prompt to get domain configuration from user."""
    print("\n" + "="*60)
    print("RENDER DEPLOYMENT CONFIGURATION")
    print("="*60)
    
    print("\nThis script will help you configure your Render deployment.")
    print("You'll need to set up custom domains for your services.\n")
    
    # Frontend domain configuration
    print("FRONTEND DOMAIN CONFIGURATION")
    print("-" * 30)
    print("Choose your frontend domain structure:")
    print("1. Root domain (e.g., myapp.com)")
    print("2. Subdomain (e.g., chat.myapp.com)")
    
    while True:
        choice = input("\nEnter choice (1 or 2): ").strip()
        if choice in ['1', '2']:
            break
        print("Invalid choice. Please enter 1 or 2.")
    
    if choice == '1':
        root_domain = input("Enter your root domain (e.g., myapp.com): ").strip()
        frontend_domain = root_domain
        frontend_domains = [root_domain, f"www.{root_domain}"]
        api_domain = f"api.{root_domain}"
    else:
        subdomain = input("Enter your subdomain (e.g., chat): ").strip()
        root_domain = input("Enter your root domain (e.g., myapp.com): ").strip()
        frontend_domain = f"{subdomain}.{root_domain}"
        frontend_domains = [frontend_domain]
        api_domain = f"api.{root_domain}"
    
    # Allow custom API domain if desired
    print(f"\nSuggested API domain: {api_domain}")
    custom_api = input("Use a different API domain? (y/N): ").strip().lower()
    if custom_api == 'y':
        api_domain = input("Enter your API domain: ").strip()
    
    return {
        'frontend_domains': frontend_domains,
        'api_domain': api_domain,
        'root_domain': root_domain,
        'frontend_main': frontend_domain
    }


def generate_dns_instructions(config):
    """Generate DNS configuration instructions based on domain setup."""
    print("\n" + "="*60)
    print("DNS CONFIGURATION INSTRUCTIONS")
    print("="*60)
    print("\nAdd these DNS records at your domain registrar:\n")
    
    for domain in config['frontend_domains']:
        if domain == config['root_domain']:
            # Root domain needs special handling
            print(f"Type: CNAME")
            print(f"Name: @")
            print(f"Value: dynamous-frontend.onrender.com")
            print()
        elif domain.startswith('www.'):
            print(f"Type: CNAME")
            print(f"Name: www")
            print(f"Value: dynamous-frontend.onrender.com")
            print()
        else:
            # Subdomain
            subdomain = domain.replace(f".{config['root_domain']}", "")
            print(f"Type: CNAME")
            print(f"Name: {subdomain}")
            print(f"Value: dynamous-frontend.onrender.com")
            print()
    
    # API domain
    api_subdomain = config['api_domain'].replace(f".{config['root_domain']}", "")
    print(f"Type: CNAME")
    print(f"Name: {api_subdomain}")
    print(f"Value: dynamous-agent-api.onrender.com")
    print()
    
    print("Note: DNS propagation can take up to 24 hours, but usually completes within 1-2 hours.")


def create_frontend_env(blueprints_dir, config):
    """Create frontend environment variables file."""
    content = f"""# Frontend Environment Variables for Render
# Copy these to the frontend-env environment group in Render Dashboard

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Agent API Configuration  
VITE_AGENT_ENDPOINT=https://{config['api_domain']}/api/pydantic-agent

# Features
VITE_ENABLE_STREAMING=true
"""
    
    env_file = blueprints_dir / "frontend-env.env"
    env_file.write_text(content)
    print(f"Created: {env_file}")
    return env_file


def create_agent_api_env(blueprints_dir):
    """Create agent API environment variables file."""
    content = """# Agent API Environment Variables for Render
# Copy these to the agent-api-env environment group in Render Dashboard

# LLM Configuration
LLM_PROVIDER=openai
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=your_openai_api_key_here
LLM_CHOICE=gpt-4o-mini
VISION_LLM_CHOICE=gpt-4o-mini

# Embedding Configuration
EMBEDDING_PROVIDER=openai
EMBEDDING_BASE_URL=https://api.openai.com/v1
EMBEDDING_API_KEY=your_openai_api_key_here
EMBEDDING_MODEL_CHOICE=text-embedding-3-small

# Database Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_key_here

# Web Search Configuration
BRAVE_API_KEY=your_brave_api_key_here

# Optional Features
ENABLE_LANGFUSE=false
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=
LANGFUSE_HOST=https://cloud.langfuse.com

# Memory Configuration (optional)
ENABLE_MEM0=false
DATABASE_URL=
"""
    
    env_file = blueprints_dir / "agent-api-env.env"
    env_file.write_text(content)
    print(f"Created: {env_file}")
    return env_file


def create_rag_pipeline_env(blueprints_dir):
    """Create RAG pipeline environment variables file."""
    content = """# RAG Pipeline Environment Variables for Render
# Copy these to the rag-pipeline-env environment group in Render Dashboard

# Database Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_key_here

# Embedding Configuration (must match Agent API)
EMBEDDING_PROVIDER=openai
EMBEDDING_BASE_URL=https://api.openai.com/v1
EMBEDDING_API_KEY=your_openai_api_key_here
EMBEDDING_MODEL_CHOICE=text-embedding-3-small

# Pipeline Configuration
RAG_PIPELINE_TYPE=supabase_storage
RUN_MODE=continuous
ENVIRONMENT=production

# Google Drive Configuration (if using Google Drive pipeline)
GOOGLE_SERVICE_ACCOUNT_KEY=
GOOGLE_DRIVE_FOLDER_ID=
"""
    
    env_file = blueprints_dir / "rag-pipeline-env.env"
    env_file.write_text(content)
    print(f"Created: {env_file}")
    return env_file


def update_render_yaml_domains(config):
    """Update render.yaml with custom domains if needed."""
    render_yaml_path = Path("render.yaml")
    
    if not render_yaml_path.exists():
        print("\nWarning: render.yaml not found. Please ensure it exists before deploying.")
        return
    
    # For now, we'll just remind the user to add custom domains in Render Dashboard
    print("\n" + "="*60)
    print("CUSTOM DOMAINS")
    print("="*60)
    print("\nAfter deployment, add these custom domains in Render Dashboard:")
    print(f"\nFrontend Service:")
    for domain in config['frontend_domains']:
        print(f"  - {domain}")
    print(f"\nAgent API Service:")
    print(f"  - {config['api_domain']}")


def main():
    """Main configuration process."""
    print("\n🚀 RENDER DEPLOYMENT CONFIGURATION SCRIPT")
    
    # Check if we're in the right directory
    if not Path("backend_agent_api").exists():
        print("\n❌ Error: This script must be run from the 6_Agent_Deployment directory.")
        print("Please navigate to the correct directory and try again.")
        sys.exit(1)
    
    # Check if render.yaml exists
    if not Path("render.yaml").exists():
        print("\n⚠️  Warning: render.yaml not found.")
        print("The render.yaml file has been created for you.")
        print("Please review it before proceeding with deployment.")
    
    # Get domain configuration
    config = get_domain_configuration()
    
    # Create blueprints directory
    blueprints_dir = create_blueprints_directory()
    
    # Generate environment files
    print("\n" + "="*60)
    print("GENERATING ENVIRONMENT FILES")
    print("="*60 + "\n")
    
    create_frontend_env(blueprints_dir, config)
    create_agent_api_env(blueprints_dir)
    create_rag_pipeline_env(blueprints_dir)
    
    # Generate DNS instructions
    generate_dns_instructions(config)
    
    # Update render.yaml with domains
    update_render_yaml_domains(config)
    
    # Final instructions
    print("\n" + "="*60)
    print("NEXT STEPS")
    print("="*60)
    print("\n1. Edit the environment files in blueprints/ directory with your actual values")
    print("2. Commit and push all changes to your GitHub repository:")
    print("   git add .")
    print("   git commit -m 'Configure Render deployment'")
    print("   git push origin main")
    print("3. Configure DNS records with your domain provider (see instructions above)")
    print("4. Go to https://dashboard.render.com/blueprints")
    print("5. Click 'New Blueprint' and connect your GitHub repository")
    print("6. After deployment, add environment variables from blueprints/*.env files")
    print("7. Add custom domains in each service's settings")
    print("8. Redeploy services after configuring environment variables")
    
    print("\n✅ Configuration complete! Your deployment files are ready.")


if __name__ == "__main__":
    main()