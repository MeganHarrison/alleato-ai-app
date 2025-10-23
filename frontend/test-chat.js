const fetch = require('node-fetch');

async function testChat() {
  console.log('1. Creating session...');
  
  // Create session
  const sessionRes = await fetch('http://localhost:3000/api/chatkit/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workflow: { id: "wf_68f9ed871f3881909581687179fba37f01b09bb8edcbabda" }
    })
  });
  
  if (\!sessionRes.ok) {
    console.error('Failed to create session:', await sessionRes.text());
    return;
  }
  
  const session = await sessionRes.json();
  console.log('Session created:', session);
  
  console.log('\n2. Sending test message...');
  
  // Send message
  const messageRes = await fetch('http://localhost:3000/api/chatkit/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.client_secret}`
    },
    body: JSON.stringify({
      message: 'Hello, test message',
      session_id: session.session_id
    })
  });
  
  if (\!messageRes.ok) {
    console.error('Failed to send message:', await messageRes.text());
    return;
  }
  
  console.log('Message sent successfully\!');
  console.log('Reading response stream...');
  
  // Read streaming response
  const reader = messageRes.body.getReader();
  const decoder = new TextDecoder();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    console.log('Received:', chunk);
  }
}

testChat().catch(console.error);
