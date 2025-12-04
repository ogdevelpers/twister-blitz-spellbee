import { TwisterChallenge } from '@/types';

export const generateTwister = async (difficulty: string = "Medium"): Promise<TwisterChallenge> => {
  try {
    const response = await fetch('/api/generate-twister', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ difficulty }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const twister: TwisterChallenge = await response.json();
    return twister;
  } catch (error) {
    console.error("Error generating twister:", error);
    // Fallback in case of API error/quota limits
    return {
      text: "Six slippery snails slid slowly seaward.",
      difficulty: "Medium",
      theme: "Nature"
    };
  }
};