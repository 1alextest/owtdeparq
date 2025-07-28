const axios = require('axios');
require('dotenv').config();

async function testGroqGeneration() {
  console.log('Testing Groq generation through backend API...');
  
  try {
    const response = await axios.post('http://localhost:5000/api/decks/generate', {
      prompt: 'Create a simple pitch deck for a coffee shop startup',
      model: 'groq-llama-8b'
    }, {
      headers: {
        'Content-Type': 'application/json',
        // Add auth header if needed
      },
      timeout: 30000
    });
    
    console.log('✅ Generation successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Generation failed');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }
}

testGroqGeneration().catch(console.error);