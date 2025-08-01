const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

console.log('🧪 Starting Full Stack Test...\n');

// Test backend first
async function testBackend() {
  console.log('1️⃣ Testing Backend...');
  
  return new Promise((resolve, reject) => {
    // Start backend
    const backend = spawn('npm', ['run', 'start:dev'], {
      cwd: path.join(__dirname, 'backend-nestjs'),
      stdio: 'pipe',
      shell: true
    });

    let backendReady = false;
    
    backend.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('Backend:', output.trim());
      
      if (output.includes('Nest application successfully started') && !backendReady) {
        backendReady = true;
        console.log('✅ Backend is ready!\n');
        
        // Test backend health
        setTimeout(() => {
          const req = http.request({
            hostname: 'localhost',
            port: 3001,
            path: '/api',
            method: 'GET'
          }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
              console.log(`✅ Backend Health Check: ${res.statusCode}`);
              console.log(`✅ Response: ${data}\n`);
              resolve({ backend, success: true });
            });
          });
          
          req.on('error', (err) => {
            console.error('❌ Backend health check failed:', err.message);
            resolve({ backend, success: false });
          });
          
          req.end();
        }, 2000);
      }
    });

    backend.stderr.on('data', (data) => {
      console.error('Backend Error:', data.toString());
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!backendReady) {
        console.error('❌ Backend startup timeout');
        backend.kill();
        resolve({ backend: null, success: false });
      }
    }, 30000);
  });
}

// Test frontend
async function testFrontend() {
  console.log('2️⃣ Testing Frontend...');
  
  return new Promise((resolve, reject) => {
    // Start frontend
    const frontend = spawn('npm', ['start'], {
      cwd: path.join(__dirname, 'frontend'),
      stdio: 'pipe',
      shell: true,
      env: { ...process.env, BROWSER: 'none' }
    });

    let frontendReady = false;
    
    frontend.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('Frontend:', output.trim());
      
      if (output.includes('webpack compiled') && !frontendReady) {
        frontendReady = true;
        console.log('✅ Frontend is ready!\n');
        
        // Test frontend
        setTimeout(() => {
          const req = http.request({
            hostname: 'localhost',
            port: 3000,
            path: '/',
            method: 'GET'
          }, (res) => {
            console.log(`✅ Frontend Health Check: ${res.statusCode}`);
            resolve({ frontend, success: true });
          });
          
          req.on('error', (err) => {
            console.error('❌ Frontend health check failed:', err.message);
            resolve({ frontend, success: false });
          });
          
          req.end();
        }, 2000);
      }
    });

    frontend.stderr.on('data', (data) => {
      const output = data.toString();
      if (!output.includes('WARNING') && !output.includes('WARN')) {
        console.error('Frontend Error:', output);
      }
    });

    // Timeout after 60 seconds
    setTimeout(() => {
      if (!frontendReady) {
        console.error('❌ Frontend startup timeout');
        frontend.kill();
        resolve({ frontend: null, success: false });
      }
    }, 60000);
  });
}

// Main test function
async function runFullStackTest() {
  try {
    // Test backend
    const backendResult = await testBackend();
    
    if (!backendResult.success) {
      console.log('💥 Backend test failed - stopping here');
      return;
    }

    // Test frontend
    const frontendResult = await testFrontend();
    
    if (frontendResult.success) {
      console.log('🎉 FULL STACK TEST PASSED!');
      console.log('📱 Frontend: http://localhost:3000');
      console.log('🔧 Backend: http://localhost:3001/api');
      console.log('\n✨ Both services are running and ready for Railway deployment!');
    } else {
      console.log('💥 Frontend test failed');
    }

    // Keep processes running for manual testing
    console.log('\n⏳ Services will keep running for manual testing...');
    console.log('Press Ctrl+C to stop both services');
    
    // Handle cleanup
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping services...');
      if (backendResult.backend) backendResult.backend.kill();
      if (frontendResult.frontend) frontendResult.frontend.kill();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

runFullStackTest();