#!/usr/bin/env node

/**
 * Ollama Setup Script
 * 
 * This script helps users set up Ollama with the required models for the AI Pitch Deck Generator.
 * It checks if Ollama is installed, running, and has the necessary models.
 */

const { execSync, spawn } = require('child_process');
const readline = require('readline');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const OLLAMA_BASE_URL = 'http://localhost:11434';
const REQUIRED_MODELS = [
  { name: 'llama3.1:8b', description: 'Standard 8B model (recommended)', size: '~4.7GB' },
  { name: 'llama3.1:instruct', description: 'Instruction-tuned model for better responses', size: '~4.7GB' },
  { name: 'llama3.1:70b', description: 'Highest quality model (requires 40GB+ RAM)', size: '~40GB' }
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function checkOllamaInstalled() {
  try {
    const isWindows = process.platform === 'win32';
    const command = isWindows ? 'where ollama' : 'which ollama';
    
    execSync(command, { stdio: 'ignore' });
    console.log('✅ Ollama is installed');
    return true;
  } catch (error) {
    console.log('❌ Ollama is not installed');
    console.log('\nPlease install Ollama from https://ollama.ai');
    
    if (process.platform === 'darwin') {
      console.log('\nOn macOS, you can install with:');
      console.log('  brew install ollama');
    } else if (process.platform === 'linux') {
      console.log('\nOn Linux, you can install with:');
      console.log('  curl -fsSL https://ollama.ai/install.sh | sh');
    } else if (process.platform === 'win32') {
      console.log('\nOn Windows, download the installer from:');
      console.log('  https://ollama.ai/download/windows');
    }
    
    return false;
  }
}

async function checkOllamaRunning() {
  try {
    await axios.get(`${OLLAMA_BASE_URL}/api/tags`, { timeout: 2000 });
    console.log('✅ Ollama service is running');
    return true;
  } catch (error) {
    console.log('❌ Ollama service is not running');
    console.log('\nPlease start Ollama with:');
    console.log('  ollama serve');
    
    const startNow = await askQuestion('Would you like to start Ollama now? (y/n): ');
    if (startNow.toLowerCase() === 'y') {
      startOllamaService();
      return true;
    }
    
    return false;
  }
}

function startOllamaService() {
  console.log('\nStarting Ollama service...');
  
  const isWindows = process.platform === 'win32';
  const ollamaProcess = spawn('ollama', ['serve'], {
    detached: true,
    stdio: 'ignore',
    shell: isWindows
  });
  
  ollamaProcess.unref();
  
  console.log('Ollama service started in the background');
  console.log('Waiting for service to initialize...');
  
  // Wait for the service to start
  return new Promise(resolve => {
    setTimeout(async () => {
      try {
        await axios.get(`${OLLAMA_BASE_URL}/api/tags`, { timeout: 2000 });
        console.log('✅ Ollama service is now running');
        resolve(true);
      } catch (error) {
        console.log('❌ Ollama service failed to start properly');
        resolve(false);
      }
    }, 5000);
  });
}

async function checkAvailableModels() {
  try {
    const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, { timeout: 5000 });
    const availableModels = response.data.models || [];
    
    console.log('\nAvailable models:');
    availableModels.forEach(model => {
      console.log(`- ${model.name}`);
    });
    
    return availableModels.map(m => m.name);
  } catch (error) {
    console.log('❌ Failed to get available models');
    return [];
  }
}

async function pullModel(modelName) {
  console.log(`\nPulling model: ${modelName}`);
  console.log('This may take a while depending on your internet connection...');
  
  try {
    const pullProcess = spawn('ollama', ['pull', modelName], {
      stdio: 'inherit'
    });
    
    return new Promise((resolve, reject) => {
      pullProcess.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ Successfully pulled ${modelName}`);
          resolve(true);
        } else {
          console.log(`❌ Failed to pull ${modelName}`);
          resolve(false);
        }
      });
    });
  } catch (error) {
    console.log(`❌ Error pulling model: ${error.message}`);
    return false;
  }
}

async function askQuestion(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer);
    });
  });
}

async function updateEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  
  try {
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Check if Ollama config exists
      if (!envContent.includes('OLLAMA_ENABLED')) {
        envContent += '\n# Ollama Configuration\n';
        envContent += 'OLLAMA_BASE_URL=http://localhost:11434\n';
        envContent += 'OLLAMA_ENABLED=true\n';
        envContent += 'OLLAMA_DEFAULT_MODEL=llama3.1:8b\n';
      } else {
        // Update existing config
        envContent = envContent.replace(/OLLAMA_ENABLED=false/g, 'OLLAMA_ENABLED=true');
      }
      
      fs.writeFileSync(envPath, envContent);
      console.log('✅ Updated .env file with Ollama configuration');
    } else {
      console.log('❌ .env file not found');
    }
  } catch (error) {
    console.log(`❌ Error updating .env file: ${error.message}`);
  }
}

async function main() {
  console.log('=== Ollama Setup for AI Pitch Deck Generator ===\n');
  
  const isInstalled = await checkOllamaInstalled();
  if (!isInstalled) {
    rl.close();
    return;
  }
  
  const isRunning = await checkOllamaRunning();
  if (!isRunning) {
    rl.close();
    return;
  }
  
  const availableModels = await checkAvailableModels();
  
  console.log('\nRequired models:');
  REQUIRED_MODELS.forEach(model => {
    const isAvailable = availableModels.some(m => m === model.name);
    console.log(`${isAvailable ? '✅' : '❌'} ${model.name} - ${model.description} (${model.size})`);
  });
  
  // Ask which models to install
  console.log('\nWhich models would you like to install?');
  
  for (const model of REQUIRED_MODELS) {
    const isAvailable = availableModels.some(m => m === model.name);
    
    if (!isAvailable) {
      const answer = await askQuestion(`Install ${model.name} (${model.size})? (y/n): `);
      
      if (answer.toLowerCase() === 'y') {
        await pullModel(model.name);
      }
    }
  }
  
  // Update .env file
  await updateEnvFile();
  
  console.log('\n=== Setup Complete ===');
  console.log('You can now use Ollama models in the AI Pitch Deck Generator');
  console.log('Restart your application for changes to take effect');
  
  rl.close();
}

main().catch(console.error);