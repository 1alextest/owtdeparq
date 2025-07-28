const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Installing Groq SDK...');

try {
  // Install the Groq SDK
  execSync('npm install groq-sdk', { stdio: 'inherit' });
  
  console.log('\n✅ Successfully installed Groq SDK');
  
  // Check if package.json exists
  const packageJsonPath = path.join(__dirname, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    // Read the package.json file
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Check if groq-sdk is in dependencies
    if (packageJson.dependencies && packageJson.dependencies['groq-sdk']) {
      console.log(`✅ groq-sdk ${packageJson.dependencies['groq-sdk']} is installed`);
    } else {
      console.log('⚠️ groq-sdk is not listed in package.json dependencies');
      console.log('This might be due to a permission issue or npm configuration');
    }
  }
  
  console.log('\nYou can now use Groq in your application!');
  console.log('Make sure to update your .env file with your Groq API key:');
  console.log('GROQ_API_KEY=your-groq-api-key-here');
  console.log('Get your API key from: https://console.groq.com/keys');
  
} catch (error) {
  console.error(`❌ Error installing Groq SDK: ${error.message}`);
  console.log('\nYou can manually install it with:');
  console.log('npm install groq-sdk');
}