import { openai } from '@/lib/openai';
import { CoreMessage } from 'ai';

export async function generatePresentationDraft(history: CoreMessage[]): Promise<string | null> {
  console.log(`[Presentation Generator] Starting draft generation from history...`);
  try {
    const prompt = `You are an expert presentation designer. The user wants you to create a professional 5-7 slide presentation based on their request. 
Read the conversation history to understand exactly what the presentation should be about. Focus on the most recent request.

Output EXACTLY valid JSON matching this exact schema:
{
  "title": "Main Presentation Title",
  "subtitle": "A catchy and relevant subtitle",
  "slides": [
    {
      "title": "Slide Title",
      "bullets": ["Bullet point 1 (detailed)", "Bullet point 2", "Bullet point 3"],
      "imageQuery": "A highly descriptive search query to find a real photo for this slide. Be specific. E.g. 'space telescope orbiting earth'"
    }
  ]
}
Do not include any other text or markdown blocks, only the raw JSON.`;

    // Only take the last 10 messages to avoid context overflow and keep it focused
    const recentHistory = history.slice(-10);
    const fullMessages: CoreMessage[] = [
        { role: 'system', content: prompt } as CoreMessage,
        ...recentHistory
    ];

    console.log(`[Presentation Generator] Calling LLM for structured JSON draft...`);
    const response = await openai.chat.completions.create({
      model: 'Meta-Llama-3.3-70B-Instruct', 
      messages: fullMessages as any,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("No content generated");
    
    // Validate it's JSON
    JSON.parse(content);
    console.log(`[Presentation Generator] ✅ Successfully created Draft JSON`);

    return content;

  } catch (error) {
    console.error("[Presentation Generator] ❌ Failed:", error);
    return null;
  }
}
