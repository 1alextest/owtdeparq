const { GroqProvider } = require('./dist/ai/providers/groq.provider');
const { ConfigService } = require('@nestjs/config');
require('dotenv').config();

async function testGroqProvider() {
  console.log('Testing Groq provider directly...');
  
  try {
    // Mock ConfigService
    const configService = {
      get: (key) => process.env[key]
    };
    
    const groqProvider = new GroqProvider(configService);
    
    // Test status
    const status = await groqProvider.getStatus();
    console.log('Groq status:', status);
    
    if (status === 'available') {
      console.log('✅ Groq provider is available and working!');
    } else {
      console.log('❌ Groq provider is not available:', status);
    }
    
  } catch (error) {
    console.log('❌ Error testing Groq provider:', error.message);
  }
}

testGroqProvider().catch(console.error);