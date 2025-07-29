const axios = require('axios');

async function checkOllama() {
  console.log('Checking Ollama availability...');
  
  const baseUrl = 'http://localhost:11434';
  console.log(`Using Ollama base URL: ${baseUrl}`);
  
  try {
    console.log('Attempting to connect to Ollama...');
    const response = await axios.get(`${baseUrl}/api/tags`);
    
    console.log('Ollama response received:');
    console.log(JSON.stringify(response.data, null, 2));
    
    const models = response.data.models || [];
    console.log(`Found ${models.length} models:`);
    models.forEach(model => {
      console.log(`- ${model.name}`);
    });
    
    const hasLlama = models.some(m => m.name.includes('llama3.1'));
    console.log(`Llama 3.1 model available: ${hasLlama ? 'YES' : 'NO'}`);
    
    return true;
  } catch (error) {
    console.error(`Ollama connection failed: ${error.message}`);
    console.log('Is Ollama installed and running? Visit https://ollama.ai to download and install.');
    console.log('After installation, run "ollama serve" to start the service.');
    return false;
  }
}

checkOllama().catch(console.error);
