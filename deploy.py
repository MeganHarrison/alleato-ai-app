#!/usr/bin/env python3
"""
deploy.py

This script deploys the Dynamous AI Agent stack with different configurations:
- Local: Integrates with existing AI stack (no Caddy, uses overrides for existing Caddy)
- Cloud: Standalone deployment with its own Caddy reverse proxy

Usage:
  python deploy.py --type local --project localai    # Join existing AI stack
  python deploy.py --type cloud                       # Standalone cloud deployment  
  python deploy.py --down --type local --project localai  # Stop services
"""

import argparse
import subprocess
import sys
import os

def run_command(cmd, cwd=None):
    """Run a shell command and print it."""
    print("Running:", " ".join(cmd))
    try:
        subprocess.run(cmd, cwd=cwd, check=True)
    except subprocess.CalledProcessError as e:
        print(f"Command failed with exit code {e.returncode}")
        sys.exit(1)

def validate_environment():
    """Check that required files exist."""
    required_files = ["docker-compose.yml"]
    
    for file in required_files:
        if not os.path.exists(file):
            print(f"Error: Required file '{file}' not found in current directory")
            sys.exit(1)

def deploy_agent_stack(deployment_type, project_name, action="up"):
    """Deploy or stop the agent stack based on deployment type."""
    
    # Build base command
    cmd = ["docker", "compose", "-p", project_name, "-f", "docker-compose.yml"]
    
    # Add deployment-specific compose files
    if deployment_type == "cloud":
        if not os.path.exists("docker-compose.caddy.yml"):
            print("Error: docker-compose.caddy.yml not found for cloud deployment")
            sys.exit(1)
        cmd.extend(["-f", "docker-compose.caddy.yml"])
        print(f"Cloud deployment: Including Caddy service")
        
    elif deployment_type == "local":
        print(f"Local deployment: Deploying agent services to join AI stack network")
    
    else:
        print(f"Error: Invalid deployment type '{deployment_type}'")
        sys.exit(1)
    
    # Add action (up/down)
    if action == "up":
        cmd.extend(["up", "-d", "--build"])
        print(f"Starting {deployment_type} deployment with project name '{project_name}' (rebuilding containers)...")
    elif action == "down":
        cmd.extend(["down"])
        print(f"Stopping {deployment_type} deployment with project name '{project_name}'...")
    
    # Execute command
    run_command(cmd)
    
    if action == "up":
        print(f"\n✅ {deployment_type.title()} deployment completed successfully!")
        
        if deployment_type == "local":
            print("\n📝 Local Deployment Notes:")
            print("- Agent services joined your existing AI stack network")
            print("- To enable reverse proxy routes in your Local AI Package:")
            print("  1. Copy caddy-addon.conf to your Local AI Package's caddy-addon folder")
            print("  2. Edit lines 2 and 21 in caddy-addon.conf to set your subdomains")
            print("  3. Restart Caddy: docker compose -p localai restart caddy")
            print(f"- Services running under project: {project_name}")
            
        elif deployment_type == "cloud":
            print("\n📝 Cloud Deployment Notes:")
            print("- Standalone deployment with integrated Caddy")
            print("- Configure AGENT_API_HOSTNAME and FRONTEND_HOSTNAME in .env")
            print("- Caddy will automatically provision SSL certificates")
            print("- Services accessible via configured hostnames")
    else:
        print(f"\n✅ {deployment_type.title()} deployment stopped successfully!")

def main():
    parser = argparse.ArgumentParser(
        description='Deploy the Dynamous AI Agent stack',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Local deployment (join existing AI stack)
  python deploy.py --type local --project localai
  
  # Cloud deployment (standalone with Caddy)  
  python deploy.py --type cloud
  
  # Stop local deployment
  python deploy.py --down --type local --project localai
  
  # Stop cloud deployment
  python deploy.py --down --type cloud
        """
    )
    
    parser.add_argument(
        '--type', 
        choices=['local', 'cloud'], 
        required=True,
        help='Deployment type: local (join AI stack) or cloud (standalone)'
    )
    
    parser.add_argument(
        '--project', 
        default='dynamous-agent',
        help='Docker Compose project name (default: dynamous-agent)'
    )
    
    parser.add_argument(
        '--down', 
        action='store_true',
        help='Stop and remove containers instead of starting them'
    )
    
    args = parser.parse_args()
    
    # Validate environment
    validate_environment()
    
    # Determine action
    action = "down" if args.down else "up"
    
    # Deploy
    deploy_agent_stack(args.type, args.project, action)

if __name__ == "__main__":
    main()