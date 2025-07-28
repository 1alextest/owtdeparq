import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { AiProviderService } from './ai/ai-provider.service';

async function bootstrap() {
  const logger = new Logger('DebugGeneration');
  
  try {
    logger.log('Starting debug application...');
    const app = await NestFactory.create(AppModule);
    
    // Get the AI provider service
    const aiProviderService = app.get(AiProviderService);
    
    // Check available providers
    logger.log('Checking available AI providers...');
    const providers = await aiProviderService.getAvailableProviders();
    logger.log(`Available providers: ${JSON.stringify(providers, null, 2)}`);
    
    // Test generation with a simple prompt
    logger.log('Testing generation with a simple prompt...');
    try {
      const result = await aiProviderService.generateFreeFormDeck(
        'Create a pitch deck for a tech startup that helps small businesses with AI-powered customer service',
        { model: 'gpt-3.5-turbo' }
      );
      
      logger.log(`Generation result: ${JSON.stringify({
        success: result.success,
        provider: result.provider,
        model: result.model,
        contentLength: result.content ? result.content.length : 0,
        error: result.error
      }, null, 2)}`);
    } catch (error) {
      logger.error(`Generation test failed: ${error.message}`, error.stack);
    }
    
    await app.close();
    logger.log('Debug completed');
  } catch (error) {
    logger.error(`Bootstrap error: ${error.message}`, error.stack);
  }
}

bootstrap();