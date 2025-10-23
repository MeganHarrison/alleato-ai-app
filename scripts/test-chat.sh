#!/bin/bash

# Chat Functionality Integration Test
# Tests the complete flow from frontend to backend

set -e  # Exit on any error

echo "=== Chat Functionality Test ==="
echo "Time: $(date)"
echo

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if services are running
echo "1. Checking services..."
if lsof -ti:8001 > /dev/null; then
    echo -e "${GREEN}✓ Backend is running on port 8001${NC}"
else
    echo -e "${RED}✗ Backend is NOT running on port 8001${NC}"
    exit 1
fi

if lsof -ti:3000 > /dev/null; then
    echo -e "${GREEN}✓ Frontend is running on port 3000${NC}"
else
    echo -e "${RED}✗ Frontend is NOT running on port 3000${NC}"
    exit 1
fi

echo
echo "2. Testing backend ChatKit endpoint directly..."
BACKEND_RESPONSE=$(curl -s -X POST http://localhost:8001/api/chatkit/sessions \
  -H "Content-Type: application/json" \
  -d '{"workflow": {"id": "wf_68f9ed871f3881909581687179fba37f01b09bb8edcbabda"}}')

if echo "$BACKEND_RESPONSE" | grep -q "client_secret"; then
    echo -e "${GREEN}✓ Backend session creation works${NC}"
    echo "Response: $BACKEND_RESPONSE"
else
    echo -e "${RED}✗ Backend session creation failed${NC}"
    echo "Response: $BACKEND_RESPONSE"
    exit 1
fi

echo
echo "3. Testing frontend API route..."
FRONTEND_RESPONSE=$(curl -s -X POST http://localhost:3000/api/chatkit/sessions \
  -H "Content-Type: application/json" \
  -d '{"workflow": {"id": "wf_68f9ed871f3881909581687179fba37f01b09bb8edcbabda"}}')

if echo "$FRONTEND_RESPONSE" | grep -q "client_secret"; then
    echo -e "${GREEN}✓ Frontend API route works${NC}"
    CLIENT_SECRET=$(echo "$FRONTEND_RESPONSE" | grep -o '"client_secret":"[^"]*"' | cut -d'"' -f4)
    SESSION_ID=$(echo "$FRONTEND_RESPONSE" | grep -o '"session_id":"[^"]*"' | cut -d'"' -f4)
else
    echo -e "${RED}✗ Frontend API route failed${NC}"
    echo "Response: $FRONTEND_RESPONSE"
    exit 1
fi

echo
echo "4. Testing message sending..."
MESSAGE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/chatkit/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CLIENT_SECRET" \
  -d "{\"message\": \"Hello test\", \"session_id\": \"$SESSION_ID\"}" \
  --max-time 10)

if echo "$MESSAGE_RESPONSE" | grep -q "data:"; then
    echo -e "${GREEN}✓ Message sending works${NC}"
    echo "First 200 chars of response: ${MESSAGE_RESPONSE:0:200}..."
else
    echo -e "${RED}✗ Message sending failed${NC}"
    echo "Response: $MESSAGE_RESPONSE"
    exit 1
fi

echo
echo "5. Testing ChatKitDemo page accessibility..."
PAGE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ChatKitDemo)
if [ "$PAGE_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ ChatKitDemo page is accessible (HTTP $PAGE_STATUS)${NC}"
else
    echo -e "${RED}✗ ChatKitDemo page returned HTTP $PAGE_STATUS${NC}"
    exit 1
fi

echo
echo -e "${GREEN}=== All tests passed! ===${NC}"
echo "The chat functionality is working correctly."