# Testing Protocol for Alleato AI Mastery

## MANDATORY TESTING CHECKLIST

### Before Claiming Any Feature Works:

1. **Backend Services**
   - [ ] Verify process is running: `lsof -ti:PORT`
   - [ ] Test health endpoint if exists
   - [ ] Test actual API endpoints with curl
   - [ ] Check logs for errors: `docker logs SERVICE_NAME` or process output

2. **Frontend Features**
   - [ ] Test page accessibility (HTTP status)
   - [ ] Test API routes directly
   - [ ] Test full user flow with automated script
   - [ ] Verify in actual browser

3. **Integration Testing**
   - [ ] Test complete flow from frontend to backend
   - [ ] Verify data persistence
   - [ ] Check error handling

## Automated Test Scripts

### Chat Functionality Test
```bash
# Run from project root
./scripts/test-chat.sh
```

### API Health Check
```bash
# Run from project root
./scripts/test-api.sh
```

## Test Evidence Requirements

Before stating something works, provide:
1. Exact command run
2. Full output (not truncated)
3. Timestamp of test
4. Any error messages encountered

## Common Test Commands

### Backend Tests
```bash
# ChatKit Backend
curl -X POST http://localhost:8001/api/chatkit/sessions \
  -H "Content-Type: application/json" \
  -d '{"workflow": {"id": "wf_68f9ed871f3881909581687179fba37f01b09bb8edcbabda"}}'

# Pydantic Agent
curl -X POST http://localhost:8001/api/pydantic-agent \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "test"}]}'
```

### Frontend Tests
```bash
# Test page access
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ChatKitDemo

# Test API route
curl -X POST http://localhost:3000/api/chatkit/sessions \
  -H "Content-Type: application/json" \
  -d '{"workflow": {"id": "wf_68f9ed871f3881909581687179fba37f01b09bb8edcbabda"}}'
```

## Failure Protocol

If any test fails:
1. Document the exact error
2. Check service logs
3. Verify environment variables
4. Test each component in isolation
5. Fix root cause before proceeding