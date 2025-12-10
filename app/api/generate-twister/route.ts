// Cloudflare-compatible: Uses Edge Runtime and fetch API
export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { TwisterChallenge } from '@/types';

export async function POST(request: NextRequest) {
  let difficulty = "Medium";
  
  try {
    let body;
    try {
      body = await request.json();
      difficulty = body?.difficulty || "Medium";
    } catch (parseError) {
      // If JSON parsing fails, use default difficulty
      console.warn('Failed to parse request body, using default difficulty');
    }

    // Check for API key (support both OPENAI_API_KEY and API_KEY)
    // On Cloudflare, use env vars from the platform
    const apiKey = process.env.OPENAI_API_KEY || process.env.API_KEY;
    
    if (!apiKey) {
      console.error('API key not configured');
      return NextResponse.json(
        { error: 'API key not configured. Please set OPENAI_API_KEY or API_KEY environment variable.' },
        { status: 500 }
      );
    }

    const prompt = `Generate a funny, weird, or cool tongue twister suitable for a 10-15 year old. 
    It should be a single coherent sentence.
    Difficulty level: ${difficulty}.
    Topics can include: Video Games, Animals, Space, Zombies, Food, Sports, School, Superheroes.
    Make it challenging to say fast!`;

    // Use fetch directly for Edge Runtime compatibility (Cloudflare)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a fun game master creating challenges for teenagers. Always respond with valid JSON only in this exact format: {\"text\": \"the tongue twister\", \"difficulty\": \"Easy|Medium|Hard\", \"theme\": \"theme name\"}"
          },
          {
            role: "user",
            content: `${prompt}\n\nRespond with a JSON object containing: text (the tongue twister sentence), difficulty (${difficulty}), and theme (a short 1-2 word description like 'Space' or 'Zombies').`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorData}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No response content from OpenAI");
    }

    const twister: TwisterChallenge = JSON.parse(content);
    
    // Validate the response structure
    if (!twister.text || !twister.difficulty || !twister.theme) {
      throw new Error("Invalid response format from OpenAI");
    }

    return NextResponse.json(twister);

  } catch (error: any) {
    console.error("Error generating twister:", error);
    
    // Return error details in development, fallback in production
    const errorMessage = error?.message || 'Unknown error occurred';
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (isDevelopment) {
      return NextResponse.json(
        { 
          error: 'Failed to generate twister',
          details: errorMessage,
          fallback: true
        },
        { status: 500 }
      );
    }
    
    // Fallback in case of API error/quota limits
    const fallback: TwisterChallenge = {
      text: "Six slippery snails slid slowly seaward.",
      difficulty: (difficulty as 'Easy' | 'Medium' | 'Hard') || "Medium",
      theme: "Nature"
    };
    return NextResponse.json(fallback);
  }
}