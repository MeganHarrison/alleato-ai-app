import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Forward to backend API
    const backendUrl = process.env.NEXT_PUBLIC_AGENT_ENDPOINT || 'http://localhost:8001';
    const body = await request.json();
    
    console.log('Forwarding to backend:', backendUrl);
    const response = await fetch(`${backendUrl}/api/chatkit/sessions`, {
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
    
    return NextResponse.json(await response.json());
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
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