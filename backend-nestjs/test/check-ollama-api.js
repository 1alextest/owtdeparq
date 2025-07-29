const axios = require('axios');

async function checkOllamaAPI() {
  console.log('Checking if Ollama API is accessible...');
  
  try {
    const response = await axios.get('http://localhost:11434/api/tags', {
      timeout: 5000
    });
    
    console.log('✅ Ollama API is accessible!');
    console.log('API Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return true;
  } catch (error) {
    console.log('❌ Could not access Ollama API');
    console.log(`Error: ${error.message}`);
    
    console.log('\nPossible reasons:');
    console.log('1. Ollama service is not running');
    console.log('2. Ollama is running on a different port');
    console.log('3. Firewall is blocking the connection');
    
    console.log('\nTroubleshooting steps:');
    console.log('1. Make sure Ollama is running');
    console.log('2. Check if you can access http://localhost:11434 in your browser');
    console.log('3. Verify the OLLAMA_BASE_URL in your .env file');
    
    return false;
  }
}

checkOllamaAPI().catch(console.error);
