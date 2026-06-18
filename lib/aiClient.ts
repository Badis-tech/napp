// AI Service Client
// Configure with your AI service API details

const AI_API_BASE = process.env.NEXT_PUBLIC_AI_API_URL || 'https://api.openai.com/v1';
const AI_API_KEY = process.env.AI_API_KEY || '';

interface AIRequest {
  prompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

interface AIResponse {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export async function callAI(request: AIRequest): Promise<AIResponse> {
  if (!AI_API_KEY) {
    throw new Error('AI API key not configured');
  }

  try {
    const response = await fetch(`${AI_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: request.model || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: request.prompt }],
        max_tokens: request.maxTokens || 500,
        temperature: request.temperature || 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      text: data.choices[0]?.message?.content || '',
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
    };
  } catch (error) {
    console.error('AI API call failed:', error);
    throw error;
  }
}
