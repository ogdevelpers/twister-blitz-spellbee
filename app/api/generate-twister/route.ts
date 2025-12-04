export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { TwisterChallenge } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { difficulty = "Medium" } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const prompt = `Generate a funny, weird, or cool tongue twister suitable for a 10-15 year old. 
    It should be a single coherent sentence.
    Difficulty level: ${difficulty}.
    Topics can include: Video Games, Animals, Space, Zombies, Food, Sports, School, Superheroes.
    Make it challenging to say fast!`;

    const response = await openai.chat.completions.create({
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
    });

    const content = response.choices[0]?.message?.content;
    
    if (content) {
      const twister: TwisterChallenge = JSON.parse(content);
      return NextResponse.json(twister);
    }
    
    throw new Error("No response content from OpenAI");

  } catch (error) {
    console.error("Error generating twister:", error);
    // Fallback in case of API error/quota limits
    const fallback: TwisterChallenge = {
      text: "Six slippery snails slid slowly seaward.",
      difficulty: "Medium",
      theme: "Nature"
    };
    return NextResponse.json(fallback);
  }
}