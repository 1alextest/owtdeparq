const { spawn } = require('child_process');

console.log('Pulling Llama 3.1 (8B) model...');
console.log('This may take a while depending on your internet connection...');

const pullProcess = spawn('ollama', ['pull', 'llama3.1:8b'], {
  stdio: 'inherit'
});

pullProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Successfully pulled llama3.1:8b model');
    console.log('You can now use the local Llama model in the AI Pitch Deck Generator');
  } else {
    console.log('❌ Failed to pull the model');
    console.log('Make sure Ollama is installed and running');
  }
});
