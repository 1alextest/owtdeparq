const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

console.log('🎯 Testing Render Deployment Simulation...\n');

async function testRenderBackend() {
  console.log('1️⃣ Testing Backend (Render Web Service)...');
  
  // Set Render environment variables
  process.env.NODE_ENV = 'production';
  process.env.PORT = '10000';
  
  return new Promise((resolve) => {
    console.log('📦 Building backend...');
    
    const buildProcess = spawn('npm', ['run', 'build'], {
      cwd: path.join(__dirname, 'backend-nestjs'),
      stdio: 'pipe',
      shell: true,
      env: process.env
    });

    buildProcess.stdout.on('data', (data) => {
      console.log('Build:', data.toString().trim());
    });

    buildProcess.on('close', (buildCode) => {
      if (buildCode === 0) {
        console.log('✅ Backend build successful!');
        
        // Start the backend
        console.log('🚀 Starting backend...');
        const startProcess = spawn('npm', ['run', 'start:prod'], {
          cwd: path.join(__dirname, 'backend-nestjs'),
          stdio: 'pipe',
          shell: true,
          env: process.env
        });

        let serverReady = false;
        
        startProcess.stdout.on('data', (data) => {
          const output = data.toString();
          console.log('Backend:', output.trim());
          
          if (output.includes('Application is running') && !serverReady) {
            serverReady = true;
            
            // Test health endpoint
            setTimeout(() => {
              const req = http.request({
                hostname: 'localhost',
                port: 10000,
                path: '/api',
                method: 'GET'
              }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                  console.log(`✅ Backend Health: ${res.statusCode} - ${data}`);
                  startProcess.kill();
                  resolve({ success: true });
                });
              });
              
              req.on('error', (err) => {
                console.error('❌ Backend health failed:', err.message);
                startProcess.kill();
                resolve({ success: false });
              });
              
              req.end();
            }, 3000);
          }
        });

        startProcess.stderr.on('data', (data) => {
          console.error('Backend Error:', data.toString());
        });

        // Timeout
        setTimeout(() => {
          if (!serverReady) {
            console.error('❌ Backend startup timeout');
            startProcess.kill();
            resolve({ success: false });
          }
        }, 30000);
        
      } else {
        console.error('❌ Backend build failed');
        resolve({ success: false });
      }
    });
  });
}

async function testRenderFrontend() {
  console.log('\n2️⃣ Testing Frontend (Render Static Site)...');
  
  // Set Render environment variables
  process.env.REACT_APP_API_BASE_URL = 'http://localhost:10000';
  
  return new Promise((resolve) => {
    console.log('📦 Building frontend...');
    
    const buildProcess = spawn('npm', ['run', 'build'], {
      cwd: path.join(__dirname, 'frontend'),
      stdio: 'pipe',
      shell: true,
      env: process.env
    });

    buildProcess.stdout.on('data', (data) => {
      console.log('Frontend Build:', data.toString().trim());
    });

    buildProcess.on('close', (buildCode) => {
      if (buildCode === 0) {
        console.log('✅ Frontend build successful!');
        
        // Test serving the built files
        console.log('🌐 Testing static file serving...');
        const serveProcess = spawn('npx', ['serve', '-s', 'build', '-l', '3000'], {
          cwd: path.join(__dirname, 'frontend'),
          stdio: 'pipe',
          shell: true
        });

        let serverReady = false;
        
        serveProcess.stdout.on('data', (data) => {
          const output = data.toString();
          console.log('Frontend Serve:', output.trim());
          
          if (output.includes('Accepting connections') && !serverReady) {
            serverReady = true;
            
            // Test frontend
            setTimeout(() => {
              const req = http.request({
                hostname: 'localhost',
                port: 3000,
                path: '/',
                method: 'GET'
              }, (res) => {
                console.log(`✅ Frontend Health: ${res.statusCode}`);
                serveProcess.kill();
                resolve({ success: res.statusCode === 200 });
              });
              
              req.on('error', (err) => {
                console.error('❌ Frontend health failed:', err.message);
                serveProcess.kill();
                resolve({ success: false });
              });
              
              req.end();
            }, 2000);
          }
        });

        // Timeout
        setTimeout(() => {
          if (!serverReady) {
            console.error('❌ Frontend serve timeout');
            serveProcess.kill();
            resolve({ success: false });
          }
        }, 20000);
        
      } else {
        console.error('❌ Frontend build failed');
        resolve({ success: false });
      }
    });
  });
}

async function runRenderTest() {
  try {
    const backendResult = await testRenderBackend();
    const frontendResult = await testRenderFrontend();
    
    console.log('\n📊 Render Deployment Test Results:');
    console.log(`Backend: ${backendResult.success ? '✅ Ready' : '❌ Failed'}`);
    console.log(`Frontend: ${frontendResult.success ? '✅ Ready' : '❌ Failed'}`);
    
    if (backendResult.success && frontendResult.success) {
      console.log('\n🎉 RENDER DEPLOYMENT TEST PASSED!');
      console.log('🚀 Your app is ready to deploy on Render!');
      console.log('\nNext steps:');
      console.log('1. Go to https://render.com');
      console.log('2. Connect your GitHub repository');
      console.log('3. Use the render.yaml configuration');
      console.log('4. Add your environment variables');
    } else {
      console.log('\n💥 Some tests failed - check the logs above');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

runRenderTest();