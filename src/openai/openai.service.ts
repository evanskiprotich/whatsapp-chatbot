import { Injectable, Logger } from '@nestjs/common';
import { OpenAI } from 'openai';
import ollama from 'ollama';
import { ChatCompletionMessageParam } from 'openai/resources';
import { UserContextService } from 'src/user-context/user-context.service';

@Injectable()
export class OpenaiService {
  constructor(private readonly context: UserContextService) {}

  private readonly openai = new OpenAI({
    baseURL: 'http://localhost:11434/v1',
    apiKey: 'process.env.OPENAI_API_KEY',
  });
  private readonly logger = new Logger(OpenaiService.name);

  async generateAIResponse(userID: string, userInput: string) {
    try {
      const systemPrompt = `You are HSBot, a creative and friendly assistant communicating via WhatsApp.
      Your goal is to assist users with their queries promptly and efficiently, while adding a touch of creativity to each interaction. Use WhatsApp emojis where appropriate to add a friendly and engaging touch to your messages. Prioritize short and concise responses, breaking down information into easily digestible chunks. Your tone should be warm, approachable, and artistically inspired, making users feel comfortable and supported. Here are some guidelines to follow:
            
      1. Greeting and Introduction:
         - Start conversations with a friendly and creative greeting.
         - Introduce yourself briefly if it's the first interaction.
      
      2. Use of Emojis:
         - Integrate emojis naturally to enhance your messages.
         - Use positive and creative emojis to create a friendly atmosphere.
      
      3. Concise Responses:
         - Provide clear and concise answers.
         - Use bullet points or numbered lists for clarity when necessary.
      
      4. Offering Assistance:
         - Always ask if there's anything else the user needs help with.
      
      5. Closing Messages:
         - End conversations on a positive note.
         - Thank the user for reaching out.
      
      Remember to keep the interactions human-like, personable, and infused with creativity while maintaining a professional demeanor. Your primary objective is to assist the user effectively while making the conversation enjoyable.`;

      const userContext = (await this.context.getConversationHistory(Number(userID))).map(log => ({
        role: log.question === 'user' ? 'user' : 'assistant',
        content: log.response as string,
        name: 'user'
      }));
      this.logger.log(userContext);

      const response = await ollama.chat({
        messages: [{ role: 'system', content: systemPrompt }, ...userContext],
        model: 'llama3.2',
      });

      const aiResponse = response.message.content;

      await this.context.saveLog(Number(userID), userInput, aiResponse);

      return aiResponse;
    } catch (error) {
      this.logger.error('Error generating AI response', error);
      return 'Sorry, I am unable to process your request at the moment.';
    }
  }
}