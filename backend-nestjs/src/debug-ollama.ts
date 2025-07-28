import axios from 'axios';

async function checkOllama() {
  console.log('Checking Ollama availability...');
  
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  console.log(`Using Ollama base URL: ${baseUrl}`);
  
  try {
    console.log('Attempting to connect to Ollama...');
    const response = await axios.get(`${baseUrl}/api/tags`, {
      timeout: 5000,
    });
    
    console.log('Ollama response received:');
    console.log(JSON.stringify(response.data, null, 2));
    
    const models = response.data.models || [];
    console.log(`Found ${models.length} models:`);
    models.forEach(model => {
      console.log(`- ${model.name}`);
    });
    
    const hasLlama = models.some(m => m.name.includes('llama3.1'));
    console.log(`Llama 3.1 model available: ${hasLlama ? 'YES' : 'NO'}`);
    
    if (!hasLlama) {
      console.log('Attempting to pull Llama 3.1 model...');
      try {
        await axios.post(`${baseUrl}/api/pull`, {
          name: 'llama3.1:8b',
        }, {
          timeout: 10000, // Just check if pull starts, don't wait for completion
        });
        console.log('Pull request sent successfully. Model download started.');
      } catch (pullError) {
        console.error(`Failed to pull model: ${pullError.message}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error(`Ollama connection failed: ${error.message}`);
    console.log('Is Ollama installed and running? Visit https://ollama.ai to download and install.');
    console.log('After installation, run "ollama serve" to start the service.');
    return false;
  }
}

async function main() {
  console.log('=== Ollama Diagnostic Tool ===');
  const ollamaAvailable = await checkOllama();
  
  if (!ollamaAvailable) {
    console.log('\nRecommendations:');
    console.log('1. Install Ollama from https://ollama.ai');
    console.log('2. Start Ollama with "ollama serve"');
    console.log('3. Pull the Llama 3.1 model with "ollama pull llama3.1:8b"');
    console.log('4. Update your .env file with:');
    console.log('   OLLAMA_ENABLED=true');
    console.log('   OLLAMA_BASE_URL=http://localhost:11434');
    console.log('   OLLAMA_DEFAULT_MODEL=llama3.1:8b');
  } else {
    console.log('\nOllama is available and ready to use!');
    console.log('Make sure your .env file has:');
    console.log('OLLAMA_ENABLED=true');
  }
}

main().catch(console.error);