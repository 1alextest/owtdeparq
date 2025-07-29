const axios = require('axios');

async function checkModels() {
  try {
    console.log('Checking available models...');
    
    // Check if Ollama is running
    try {
      const ollamaResponse = await axios.get('http://localhost:11434/api/tags', { timeout: 3000 });
      console.log('✅ Ollama is running');
      
      const models = ollamaResponse.data.models || [];
      console.log(`Found ${models.length} models:`);
      
      models.forEach(model => {
        console.log(`- ${model.name}`);
      });
      
      // Check for required models
      const requiredModels = [
        'llama3.1:8b',
        'llama3.1:instruct',
        'llama3.1:70b'
      ];
      
      console.log('\nChecking for required models:');
      requiredModels.forEach(model => {
        const found = models.some(m => m.name === model);
        console.log(`${found ? '✅' : '❌'} ${model}`);
      });
      
      if (!models.some(m => m.name.includes('llama3.1'))) {
        console.log('\n⚠️ No Llama 3.1 models found. You need to pull at least one:');
        console.log('ollama pull llama3.1:8b');
      }
    } catch (error) {
      console.log('❌ Ollama is not running or not responding');
      console.log('Make sure Ollama is installed and running with:');
      console.log('ollama serve');
    }
    
    // Check backend health
    try {
      const backendResponse = await axios.get('http://localhost:3001/health', { timeout: 3000 });
      console.log('\n✅ Backend is running');
    } catch (error) {
      console.log('\n❌ Backend is not running or not responding');
    }
    
  } catch (error) {
    console.error('Error checking models:', error.message);
  }
}

checkModels();
