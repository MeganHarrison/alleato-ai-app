#!/bin/bash

# Setup script for automated insights generation
# This script helps configure automatic insights generation

echo "🚀 INSIGHTS AUTOMATION SETUP"
echo "============================"
echo ""

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "Choose your automation method:"
echo "1) Cron Job (Linux/Mac) - Run every 2 hours"
echo "2) GitHub Actions - Run on schedule"
echo "3) Manual Script - Just test the automation script"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
  1)
    echo ""
    echo "Setting up Cron Job..."

    # Create the cron command
    CRON_CMD="0 */2 * * * cd $SCRIPT_DIR && /usr/bin/python3 auto_generate_insights.py >> insights_cron.log 2>&1"

    # Check if cron job already exists
    if crontab -l 2>/dev/null | grep -q "auto_generate_insights.py"; then
        echo "❌ Cron job already exists. Remove it first with: crontab -e"
    else
        # Add to crontab
        (crontab -l 2>/dev/null; echo "$CRON_CMD") | crontab -
        echo "✅ Cron job added successfully!"
        echo "   Will run every 2 hours"
        echo ""
        echo "To view: crontab -l"
        echo "To edit: crontab -e"
        echo "To remove: crontab -r"
    fi
    ;;

  2)
    echo ""
    echo "Creating GitHub Actions workflow..."

    # Create .github/workflows directory
    WORKFLOW_DIR="$SCRIPT_DIR/../../../.github/workflows"
    mkdir -p "$WORKFLOW_DIR"

    # Create workflow file
    cat > "$WORKFLOW_DIR/generate-insights.yml" << 'EOF'
name: Generate Document Insights

on:
  schedule:
    # Run every 2 hours
    - cron: '0 */2 * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  generate-insights:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.10'

    - name: Install dependencies
      run: |
        cd 6_Agent_Deployment/backend_rag_pipeline
        pip install -r requirements.txt

    - name: Generate Insights
      env:
        SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
        SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
        LLM_API_KEY: ${{ secrets.LLM_API_KEY }}
      run: |
        cd 6_Agent_Deployment/backend_rag_pipeline/scripts
        python auto_generate_insights.py

    - name: Upload logs
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: insights-logs
        path: 6_Agent_Deployment/backend_rag_pipeline/scripts/insights_generation.log
EOF

    echo "✅ GitHub Actions workflow created!"
    echo "   File: .github/workflows/generate-insights.yml"
    echo ""
    echo "⚠️  Remember to add these secrets to your GitHub repo:"
    echo "   - SUPABASE_URL"
    echo "   - SUPABASE_SERVICE_KEY"
    echo "   - LLM_API_KEY"
    echo ""
    echo "Go to: Settings > Secrets and variables > Actions"
    ;;

  3)
    echo ""
    echo "Testing automation script..."
    cd "$SCRIPT_DIR"
    python3 auto_generate_insights.py
    ;;

  *)
    echo "Invalid choice"
    exit 1
    ;;
esac

echo ""
echo "📊 Additional Configuration Options:"
echo ""
echo "Environment variables you can set in .env:"
echo "  INSIGHTS_BATCH_SIZE=10     # Documents per batch"
echo "  MAX_DOCS_PER_RUN=50        # Max documents per run"
echo "  SLACK_WEBHOOK_URL=...      # Optional Slack notifications"
echo ""
echo "✨ Setup complete!"