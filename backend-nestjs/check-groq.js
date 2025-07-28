const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function checkGroq() {
  console.log('Checking Groq configuration...');
  
  const apiKey = process.env.GROQ_API_KEY;
  const enabled = process.env.GROQ_ENABLED === 'true';
  
  if (!apiKey || apiKey === 'your-groq-api-key-here') {
    console.log('❌ Groq API key not configured or using placeholder value');
    console.log('Please update your .env file with a valid Groq API key');
    console.log('Get your API key from https://console.groq.com/keys');
    return false;
  }
  
  if (!enabled) {
    console.log('❌ Groq is disabled in configuration');
    console.log('Set GROQ_ENABLED=true in your .env file to enable Groq');
    return false;
  }
  
  console.log('✅ Groq configuration looks good');
  console.log('Testing Groq API connection...');
  
  try {
    const baseUrl = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';
    console.log(`Using Groq base URL: ${baseUrl}`);
    
    const response = await axios.post(
      `${baseUrl}/chat/completions`,
      {
        model: 'llama3-8b-8192',
        messages: [{ role: 'user', content: 'Hello, are you working?' }],
        max_tokens: 10
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    
    console.log('✅ Groq API connection successful!');
    console.log('Response:', response.data.choices[0].message.content);
    
    console.log('\nAvailable models:');
    console.log('- llama3-70b-8192 (Llama 3 70B)');
    console.log('- llama3-8b-8192 (Llama 3 8B)');
    console.log('- gemma-7b-it (Gemma 7B)');
    
    return true;
  } catch (error) {
    console.log('❌ Groq API connection failed');
    if (error.response) {
      console.log('Error:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
    return false;
  }
}

checkGroq().catch(console.error);