#!/bin/bash

# API Health Check Script
# Tests all API endpoints to ensure they're responding correctly

set -e  # Exit on any error

echo "=== API Health Check ==="
echo "Time: $(date)"
echo

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local url=$3
    local data=$4
    local expected=$5
    
    echo -n "Testing $name... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$url")
    else
        response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$url")
    fi
    
    http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d':' -f2)
    body=$(echo "$response" | sed '/HTTP_CODE:/d')
    
    if [ "$http_code" = "$expected" ]; then
        echo -e "${GREEN}✓ HTTP $http_code${NC}"
        if [ -n "$body" ]; then
            echo "  Response: ${body:0:100}..."
        fi
    else
        echo -e "${RED}✗ HTTP $http_code (expected $expected)${NC}"
        echo "  Response: $body"
    fi
    echo
}

# Backend API Tests
echo "=== Backend API (port 8001) ==="
if lsof -ti:8001 > /dev/null; then
    echo -e "${GREEN}Backend is running${NC}"
    echo
    
    # Test ChatKit endpoints
    test_endpoint "ChatKit Sessions" "POST" "http://localhost:8001/api/chatkit/sessions" \
        '{"workflow": {"id": "wf_68f9ed871f3881909581687179fba37f01b09bb8edcbabda"}}' "200"
    
    # Test Pydantic Agent endpoint (may fail if wrong backend is running)
    test_endpoint "Pydantic Agent" "POST" "http://localhost:8001/api/pydantic-agent" \
        '{"messages": [{"role": "user", "content": "test"}]}' "200"
    
else
    echo -e "${RED}Backend is NOT running on port 8001${NC}"
fi

# Frontend API Tests
echo
echo "=== Frontend API (port 3000) ==="
if lsof -ti:3000 > /dev/null; then
    echo -e "${GREEN}Frontend is running${NC}"
    echo
    
    # Test main page
    test_endpoint "Homepage" "GET" "http://localhost:3000/" "" "200"
    
    # Test ChatKit API routes
    test_endpoint "ChatKit Sessions API" "POST" "http://localhost:3000/api/chatkit/sessions" \
        '{"workflow": {"id": "wf_68f9ed871f3881909581687179fba37f01b09bb8edcbabda"}}' "200"
    
    # Test protected pages
    test_endpoint "ChatKitDemo Page" "GET" "http://localhost:3000/ChatKitDemo" "" "200"
    
else
    echo -e "${RED}Frontend is NOT running on port 3000${NC}"
fi

# Database connection test
echo
echo "=== Database Connection ==="
if [ -n "$DATABASE_URL" ]; then
    echo -e "${GREEN}DATABASE_URL is set${NC}"
else
    echo -e "${YELLOW}⚠ DATABASE_URL is not set in environment${NC}"
fi

# Summary
echo
echo "=== Summary ==="
echo "Run './scripts/test-chat.sh' for full integration test"