import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  console.log('Journal API route called');
  try {
    // Get the API key from environment variables
    console.log('Available environment variables:', Object.keys(process.env).filter(key => 
      key.includes('API') || key.includes('KEY') || key.includes('OPEN')
    ));
    
    // Use OPENKEYGSMD as the primary API key variable
    const apiKey = process.env.OPENKEYGSMD;
    console.log('OPENKEYGSMD exists:', apiKey ? 'Yes' : 'No');
    
    // Try alternative environment variable names if needed
    const alternativeKeys = {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      JOPENAPIKEY: process.env.JOPENAPIKEY,
      NEXT_PUBLIC_OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY
    };
    
    console.log('Alternative keys available:', Object.entries(alternativeKeys)
      .filter(([, value]) => !!value)
      .map(([key]) => key));
    
    // Use OPENKEYGSMD as primary, fall back to alternatives if needed
    let finalApiKey = apiKey;
    if (!finalApiKey) {
      finalApiKey = alternativeKeys.OPENAI_API_KEY || 
                   alternativeKeys.JOPENAPIKEY || 
                   alternativeKeys.NEXT_PUBLIC_OPENAI_API_KEY;
      
      console.log('Using alternative API key:', finalApiKey ? 'Yes' : 'No');
    }
    
    if (!finalApiKey) {
      console.error('API key not found in any environment variables');
      return NextResponse.json(
        { error: 'API key not found in environment variables' },
        { status: 500 }
      );
    }
    console.log('API key found, proceeding with request');

    // Get the request body
    const body = await request.json();
    console.log('Request body parsed:', {
      messageCount: body.messages?.length || 0,
      temperature: body.temperature,
      max_tokens: body.max_tokens
    });
    
    // Make the API call to OpenAI
    console.log('Making request to OpenAI API');
    const requestBody = {
      model: 'gpt-3.5-turbo',
      messages: body.messages,
      temperature: body.temperature || 0.7,
      max_tokens: body.max_tokens || 250
    };
    
    console.log('OpenAI request configuration:', {
      model: requestBody.model,
      messageCount: requestBody.messages?.length || 0,
      temperature: requestBody.temperature,
      max_tokens: requestBody.max_tokens
    });
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${finalApiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log('OpenAI API response status:', response.status);
    
    // Check if the response is successful
    if (!response.ok) {
      const responseText = await response.text();
      console.error('OpenAI API error response:', responseText);
      
      let errorMessage = 'Unknown error';
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error?.message || response.statusText;
        console.error('Parsed error message:', errorMessage);
      } catch {
        errorMessage = responseText || response.statusText;
        console.error('Could not parse error response, using raw text');
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    // Return the response data
    const data = await response.json();
    console.log('OpenAI API success response:', {
      choicesCount: data.choices?.length || 0,
      firstChoiceContentLength: data.choices?.[0]?.message?.content?.length || 0
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in journal API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
