const axios = require('axios');

async function pullModelViaAPI() {
  console.log('Pulling Llama 3.1 (8B) model via API...');
  console.log('This may take a while depending on your internet connection...');
  
  try {
    console.log('Sending pull request to Ollama API...');
    
    const response = await axios.post('http://localhost:11434/api/pull', {
      name: 'llama3.1:8b'
    }, {
      timeout: 10000 // 10 second timeout just to start the pull
    });
    
    console.log('✅ Pull request sent successfully!');
    console.log('The model download has started in the background.');
    console.log('This may take several minutes to complete.');
    console.log('\nTo check if the model is ready, run:');
    console.log('node backend-nestjs/test/check-ollama-api.js');
    
    return true;
  } catch (error) {
    console.log('❌ Failed to pull the model');
    console.log(`Error: ${error.message}`);
    
    return false;
  }
}

pullModelViaAPI().catch(console.error);
