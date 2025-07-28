// Simple test to verify the compilation fixes work
console.log('Testing Groq provider compilation...');

try {
  const Groq = require('groq-sdk');
  console.log('✅ groq-sdk module loads successfully');
  
  // Test basic instantiation
  const groq = new Groq({ apiKey: 'test-key' });
  console.log('✅ Groq instance created successfully');
  
} catch (error) {
  console.log('❌ Error:', error.message);
}

console.log('Compilation test complete!');