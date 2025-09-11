const https = require('https');
const http = require('http');

const BACKEND_URL = 'https://design-center-project-backend-production-ef32.up.railway.app';
const FRONTEND_URL = 'https://turbo-enigma-frontend.vercel.app';

console.log('🔍 Backend Connection Test');
console.log('==========================');
console.log(`Backend URL: ${BACKEND_URL}`);
console.log(`Frontend URL: ${FRONTEND_URL}`);
console.log('');

// Test function
function testEndpoint(path, method = 'GET', headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BACKEND_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: method,
      headers: {
        'User-Agent': 'Backend-Test-Script/1.0',
        'Origin': FRONTEND_URL,
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data,
          url: `${method} ${BACKEND_URL}${path}`
        });
      });
    });

    req.on('error', (error) => {
      reject({
        error: error.message,
        url: `${method} ${BACKEND_URL}${path}`
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject({
        error: 'Request timeout',
        url: `${method} ${BACKEND_URL}${path}`
      });
    });

    req.end();
  });
}

// Run tests
async function runTests() {
  console.log('1. Testing basic connectivity...');
  try {
    const result = await testEndpoint('/');
    console.log(`✅ Status: ${result.status}`);
    console.log(`📋 Headers:`, Object.keys(result.headers).join(', '));
    if (result.data) {
      console.log(`📄 Response: ${result.data.substring(0, 200)}...`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.error}`);
  }
  console.log('');

  console.log('2. Testing API test endpoint...');
  try {
    const result = await testEndpoint('/api/test');
    console.log(`✅ Status: ${result.status}`);
    console.log(`📋 CORS Headers:`);
    console.log(`   - Access-Control-Allow-Origin: ${result.headers['access-control-allow-origin'] || 'Not set'}`);
    console.log(`   - Access-Control-Allow-Credentials: ${result.headers['access-control-allow-credentials'] || 'Not set'}`);
    console.log(`   - Access-Control-Allow-Methods: ${result.headers['access-control-allow-methods'] || 'Not set'}`);
    if (result.data) {
      console.log(`📄 Response: ${result.data}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.error}`);
  }
  console.log('');

  console.log('3. Testing CORS preflight request...');
  try {
    const result = await testEndpoint('/api/test', 'OPTIONS', {
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'Content-Type'
    });
    console.log(`✅ Status: ${result.status}`);
    console.log(`📋 CORS Headers:`);
    console.log(`   - Access-Control-Allow-Origin: ${result.headers['access-control-allow-origin'] || 'Not set'}`);
    console.log(`   - Access-Control-Allow-Methods: ${result.headers['access-control-allow-methods'] || 'Not set'}`);
    console.log(`   - Access-Control-Allow-Headers: ${result.headers['access-control-allow-headers'] || 'Not set'}`);
  } catch (error) {
    console.log(`❌ Error: ${error.error}`);
  }
  console.log('');

  console.log('4. Testing with frontend origin...');
  try {
    const result = await testEndpoint('/api/test', 'GET', {
      'Origin': FRONTEND_URL
    });
    console.log(`✅ Status: ${result.status}`);
    console.log(`📋 Origin allowed: ${result.headers['access-control-allow-origin'] === FRONTEND_URL ? 'Yes' : 'No'}`);
  } catch (error) {
    console.log(`❌ Error: ${error.error}`);
  }
  console.log('');

  console.log('🎯 Test Summary:');
  console.log('================');
  console.log('If you see 502 errors, the backend deployment may have issues.');
  console.log('Check Railway logs for deployment errors.');
  console.log('If CORS headers are missing, the CORS configuration needs to be updated.');
}

runTests().catch(console.error);