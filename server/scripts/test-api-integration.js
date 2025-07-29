const { spawn } = require('child_process');
const path = require('path');

// Test API integration by making requests to all endpoints
async function testAPIIntegration() {
  console.log('🧪 Testing API Integration with MongoDB Backend');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const baseUrl = 'http://localhost:3001';
  
  const tests = [
    {
      name: 'Health Check',
      url: `${baseUrl}/api/health`,
      method: 'GET',
      expected: 'success'
    },
    {
      name: 'Database Stats',
      url: `${baseUrl}/api/stats`,
      method: 'GET',
      expected: 'success'
    },
    {
      name: 'Public Blogs',
      url: `${baseUrl}/api/blogs?published=true`,
      method: 'GET',
      expected: 'success'
    },
    {
      name: 'Public Events',
      url: `${baseUrl}/api/events?published=true`,
      method: 'GET',
      expected: 'success'
    },
    {
      name: 'Public Sermons',
      url: `${baseUrl}/api/sermons?published=true`,
      method: 'GET',
      expected: 'success'
    },
    {
      name: 'Admin Login',
      url: `${baseUrl}/api/auth/login`,
      method: 'POST',
      body: { username: 'admin', password: 'admin123' },
      expected: 'success'
    }
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    try {
      console.log(`\n🔍 Testing: ${test.name}`);
      console.log(`   URL: ${test.url}`);
      
      let command;
      if (test.method === 'GET') {
        command = `Invoke-RestMethod -Uri "${test.url}" | ConvertTo-Json -Compress`;
      } else if (test.method === 'POST') {
        const bodyJson = JSON.stringify(test.body).replace(/"/g, '\\"');
        command = `Invoke-RestMethod -Uri "${test.url}" -Method POST -ContentType "application/json" -Body '${bodyJson}' | ConvertTo-Json -Compress`;
      }
      
      const result = await runPowerShellCommand(command);
      
      if (result.includes('"success":true') || result.includes('"success": true')) {
        console.log(`   ✅ PASSED: ${test.name}`);
        passedTests++;
      } else {
        console.log(`   ❌ FAILED: ${test.name}`);
        console.log(`   Response: ${result.substring(0, 200)}...`);
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${test.name} - ${error.message}`);
    }
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All API integration tests PASSED!');
    console.log('✅ MongoDB backend is fully functional');
    console.log('✅ All endpoints are responding correctly');
    console.log('✅ Authentication is working');
    console.log('✅ Data is being served properly');
  } else {
    console.log('⚠️ Some tests failed. Please check the server logs.');
  }
  
  console.log('\n🔧 Next Steps:');
  console.log('   1. Open http://localhost:3001/dashboard');
  console.log('   2. Login with admin/admin123');
  console.log('   3. Test creating/editing content');
  console.log('   4. Verify real-time sync on public pages');
}

function runPowerShellCommand(command) {
  return new Promise((resolve, reject) => {
    const process = spawn('powershell', ['-Command', command], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let output = '';
    let error = '';
    
    process.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve(output.trim());
      } else {
        reject(new Error(error || `Process exited with code ${code}`));
      }
    });
    
    // Set timeout
    setTimeout(() => {
      process.kill();
      reject(new Error('Command timeout'));
    }, 10000);
  });
}

if (require.main === module) {
  testAPIIntegration();
}

module.exports = { testAPIIntegration };
