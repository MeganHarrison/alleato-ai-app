import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Forward to backend API
    const backendUrl = process.env.NEXT_PUBLIC_AGENT_ENDPOINT || 'http://localhost:8001';
    const body = await request.json();
    
    console.log('Forwarding message to backend:', backendUrl);
    
    // Forward the request to backend with streaming support
    const response = await fetch(`${backendUrl}/api/chatkit/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || ''
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend error: ${response.status} - ${errorText}`);
    }
    
    // Return the streaming response from backend
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
      }
    });
  } catch (error) {
    console.error('Message forwarding error:', error);
    return NextResponse.json(
      { error: 'Failed to forward message' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}