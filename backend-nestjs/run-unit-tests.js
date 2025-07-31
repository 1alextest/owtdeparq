#!/usr/bin/env node

const { execSync } = require('child_process');

const testFiles = [
  'projects.service.spec.ts',
  'decks.service.spec.ts', 
  'ai-provider.service.spec.ts',
  'auth.service.spec.ts',
  'firebase-auth.guard.spec.ts'
];

console.log('🧪 Running comprehensive unit tests...\n');

let totalPassed = 0;
let totalFailed = 0;
let results = [];

for (const testFile of testFiles) {
  try {
    console.log(`\n📋 Running ${testFile}...`);
    const output = execSync(`npm test -- --testPathPattern="${testFile}" --verbose --silent`, {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    // Parse test results
    const passedMatch = output.match(/(\d+) passed/);
    const failedMatch = output.match(/(\d+) failed/);
    
    const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
    const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
    
    totalPassed += passed;
    totalFailed += failed;
    
    results.push({
      file: testFile,
      passed,
      failed,
      status: failed === 0 ? '✅' : '❌'
    });
    
    console.log(`${failed === 0 ? '✅' : '❌'} ${testFile}: ${passed} passed, ${failed} failed`);
    
  } catch (error) {
    console.log(`❌ ${testFile}: Test execution failed`);
    console.log(error.stdout || error.message);
    results.push({
      file: testFile,
      passed: 0,
      failed: 1,
      status: '❌'
    });
    totalFailed += 1;
  }
}

console.log('\n' + '='.repeat(60));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(60));

results.forEach(result => {
  console.log(`${result.status} ${result.file.padEnd(35)} ${result.passed} passed, ${result.failed} failed`);
});

console.log('='.repeat(60));
console.log(`🎯 TOTAL: ${totalPassed} passed, ${totalFailed} failed`);
console.log(`📈 Success Rate: ${totalFailed === 0 ? '100%' : Math.round((totalPassed / (totalPassed + totalFailed)) * 100)}%`);

if (totalFailed === 0) {
  console.log('🎉 All tests passed! Your backend is well tested.');
} else {
  console.log('⚠️  Some tests failed. Check the output above for details.');
  process.exit(1);
}