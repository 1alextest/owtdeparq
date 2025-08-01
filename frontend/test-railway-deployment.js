const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Testing Frontend Railway Deployment Simulation...\n');

// Simulate Railway's frontend deployment process
async function testFrontendDeployment() {
  console.log('📦 Step 1: Building React app (Railway build phase)...');
  
  // Set production environment variables (like Railway would)
  process.env.NODE_ENV = 'production';
  process.env.REACT_APP_API_BASE_URL = 'http://localhost:3001'; // Simulate backend URL
  
  return new Promise((resolve, reject) => {
    // Build the React app
    const buildProcess = spawn('npm', ['run', 'build'], {
      cwd: __dirname,
      stdio: 'pipe',
      shell: true,
      env: process.env
    });

    let buildOutput = '';
    
    buildProcess.stdout.on('data', (data) => {
      const output = data.toString();
      buildOutput += output;
      console.log('Build:', output.trim());
    });

    buildProcess.stderr.on('data', (data) => {
      const output = data.toString();
      if (!output.includes('WARNING') && !output.includes('WARN')) {
        console.error('Build Error:', output);
      }
    });

    buildProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Build completed successfully!\n');
        
        // Now test serving the built app (like Railway does)
        testServeApp(resolve, reject);
      } else {
        console.error('❌ Build failed with code:', code);
        resolve({ success: false, error: 'Build failed' });
      }
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      buildProcess.kill();
      console.error('❌ Build timeout');
      resolve({ success: false, error: 'Build timeout' });
    }, 300000);
  });
}

function testServeApp(resolve, reject) {
  console.log('🌐 Step 2: Serving built app (Railway serve phase)...');
  
  // Use the same command Railway uses
  const serveProcess = spawn('npx', ['serve', '-s', 'build', '-l', '3002'], {
    cwd: __dirname,
    stdio: 'pipe',
    shell: true
  });

  let serverReady = false;
  
  serveProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log('Serve:', output.trim());
    
    if ((output.includes('Accepting connections') || output.includes('INFO')) && !serverReady) {
      serverReady = true;
      console.log('✅ Frontend server is ready!\n');
      
      // Test the served app
      setTimeout(() => {
        testFrontendHealth(serveProcess, resolve);
      }, 2000);
    }
  });

  serveProcess.stderr.on('data', (data) => {
    console.error('Serve Error:', data.toString());
  });

  // Timeout after 30 seconds
  setTimeout(() => {
    if (!serverReady) {
      console.error('❌ Server startup timeout');
      serveProcess.kill();
      resolve({ success: false, error: 'Server timeout' });
    }
  }, 30000);
}

function testFrontendHealth(serveProcess, resolve) {
  console.log('🏥 Step 3: Testing frontend health check...');
  
  const req = http.request({
    hostname: 'localhost',
    port: 3002,
    path: '/',
    method: 'GET'
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`✅ Frontend Health Check: ${res.statusCode}`);
      
      if (res.statusCode === 200) {
        console.log('✅ Frontend is serving correctly!');
        
        // Test if it can reach backend API
        testApiConnection(serveProcess, resolve);
      } else {
        console.error('❌ Frontend health check failed');
        serveProcess.kill();
        resolve({ success: false, error: 'Health check failed' });
      }
    });
  });
  
  req.on('error', (err) => {
    console.error('❌ Frontend health check error:', err.message);
    serveProcess.kill();
    resolve({ success: false, error: err.message });
  });
  
  req.end();
}

function testApiConnection(serveProcess, resolve) {
  console.log('🔗 Step 4: Testing API connection...');
  
  // Test if frontend can connect to backend API
  const req = http.request({
    hostname: 'localhost',
    port: 3001,
    path: '/api',
    method: 'GET'
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`✅ Backend API Check: ${res.statusCode}`);
      console.log(`✅ API Response: ${data}`);
      
      if (res.statusCode === 200) {
        console.log('\n🎉 FRONTEND RAILWAY DEPLOYMENT TEST PASSED!');
        console.log('📱 Frontend: http://localhost:3002');
        console.log('🔧 Backend API: http://localhost:3001/api');
        console.log('✨ Frontend is ready for Railway deployment!');
        
        // Keep server running for manual testing
        console.log('\n⏳ Frontend server will keep running for manual testing...');
        console.log('Press Ctrl+C to stop');
        
        process.on('SIGINT', () => {
          console.log('\n🛑 Stopping frontend server...');
          serveProcess.kill();
          process.exit(0);
        });
        
        resolve({ success: true, process: serveProcess });
      } else {
        console.error('❌ API connection failed');
        serveProcess.kill();
        resolve({ success: false, error: 'API connection failed' });
      }
    });
  });
  
  req.on('error', (err) => {
    console.error('❌ API connection error:', err.message);
    console.log('⚠️  Frontend built successfully but backend is not running');
    console.log('💡 Start backend with: cd backend-nestjs && npm run start:dev');
    
    serveProcess.kill();
    resolve({ success: false, error: 'Backend not available' });
  });
  
  req.end();
}

// Run the test
testFrontendDeployment().then(result => {
  if (!result.success) {
    console.log('\n💥 Frontend deployment test failed:', result.error);
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ Test error:', error);
  process.exit(1);
});