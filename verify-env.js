#!/usr/bin/env node

console.log('🔍 Verifying Environment Configuration\n');

// Check backend environment
console.log('Backend Environment (.env):');
console.log('- OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing');
console.log('- SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('- SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? '✅ Set' : '❌ Missing');
console.log('- SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');

console.log('\nFrontend Environment (should be in frontend/.env.local):');
console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not visible from backend');
console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'Not visible from backend');

console.log('\n📝 Summary:');
console.log('1. Backend needs: OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY');
console.log('2. Frontend needs: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY');
console.log('3. Make sure to restart both servers after updating .env files');

// Check if we can read the .env file
const fs = require('fs');
const path = require('path');

console.log('\n📁 Checking .env files:');
const mainEnv = path.join(__dirname, '.env');
const backendEnv = path.join(__dirname, 'backend_agent_api', '.env');
const frontendEnv = path.join(__dirname, 'frontend', '.env');
const frontendEnvLocal = path.join(__dirname, 'frontend', '.env.local');

console.log(`- Main .env: ${fs.existsSync(mainEnv) ? '✅ Exists' : '❌ Missing'}`);
console.log(`- Backend .env: ${fs.existsSync(backendEnv) ? '✅ Exists' : '❌ Missing'}`);
console.log(`- Frontend .env: ${fs.existsSync(frontendEnv) ? '✅ Exists' : '❌ Missing'}`);
console.log(`- Frontend .env.local: ${fs.existsSync(frontendEnvLocal) ? '✅ Exists' : '❌ Missing'}`);