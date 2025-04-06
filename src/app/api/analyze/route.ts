import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Get the API key from environment variables
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENKEYGSMD;
    
    if (!apiKey) {
      console.error('API key not found in environment variables');
      return NextResponse.json(
        { error: 'API key not found in environment variables' },
        { status: 500 }
      );
    }
    
    // Ensure the API key is in the correct format (should start with 'sk-')
    if (!apiKey.startsWith('sk-')) {
      console.error('Invalid API key format');
      return NextResponse.json(
        { error: 'Invalid API key format. OpenAI API keys should start with "sk-"' },
        { status: 500 }
      );
    }
    
    console.log('API key found and validated, proceeding with request');

    // Get the request body
    const body = await request.json();
    
    // Make the API call to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: body.messages,
        temperature: body.temperature || 0.7,
        max_tokens: body.max_tokens || 3000
      })
    });

    // Check if the response is successful
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error?.message || response.statusText },
        { status: response.status }
      );
    }

    // Return the response data
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
