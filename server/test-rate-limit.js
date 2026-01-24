/**
 * Rate Limiting Test Script
 * Tests the rate limiting functionality with Redis
 * 
 * Usage: node test-rate-limit.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:9999';
const TEST_USER = {
  email: 'test@example.com',
  password: 'test123'
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Test Auth Rate Limit (10 requests/minute/IP)
 */
async function testAuthRateLimit() {
  log('\n=== Testing Auth Rate Limit (10 requests/minute/IP) ===', 'blue');
  
  let successCount = 0;
  let rateLimitedCount = 0;
  
  for (let i = 1; i <= 15; i++) {
    try {
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'wrong@test.com',
        password: 'wrong'
      });
      
      successCount++;
      log(`Request ${i}: ✓ Accepted (${response.status})`, 'green');
    } catch (error) {
      if (error.response?.status === 429) {
        rateLimitedCount++;
        const data = error.response.data;
        log(`Request ${i}: ✗ Rate Limited (${error.response.status})`, 'red');
        log(`  → Retry after: ${data.retryAfter}s`, 'yellow');
        log(`  → Limit: ${data.limit} requests per ${data.windowMs / 1000}s`, 'yellow');
      } else {
        successCount++;
        log(`Request ${i}: ✓ Accepted (${error.response?.status || 'unknown'})`, 'green');
      }
    }
    
    await sleep(100); // Small delay between requests
  }
  
  log(`\nResults: ${successCount} accepted, ${rateLimitedCount} rate limited`, 'blue');
  
  if (rateLimitedCount > 0) {
    log('✓ Auth rate limiting is working!', 'green');
    return true;
  } else {
    log('⚠ Auth rate limiting may not be working (Redis might be down)', 'yellow');
    return false;
  }
}

/**
 * Test Search Rate Limit (20 requests/minute/user)
 * Note: Requires authentication
 */
async function testSearchRateLimit(token) {
  log('\n=== Testing Search Rate Limit (20 requests/minute/user) ===', 'blue');
  
  if (!token) {
    log('⚠ Skipping search test (no auth token)', 'yellow');
    return false;
  }
  
  let successCount = 0;
  let rateLimitedCount = 0;
  
  for (let i = 1; i <= 25; i++) {
    try {
      const response = await axios.get(`${BASE_URL}/api/search`, {
        params: { q: 'test' },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      successCount++;
      log(`Request ${i}: ✓ Accepted (${response.status})`, 'green');
    } catch (error) {
      if (error.response?.status === 429) {
        rateLimitedCount++;
        const data = error.response.data;
        log(`Request ${i}: ✗ Rate Limited (${error.response.status})`, 'red');
        log(`  → Retry after: ${data.retryAfter}s`, 'yellow');
      } else {
        log(`Request ${i}: Error (${error.response?.status || error.message})`, 'red');
      }
    }
    
    await sleep(100);
  }
  
  log(`\nResults: ${successCount} accepted, ${rateLimitedCount} rate limited`, 'blue');
  
  if (rateLimitedCount > 0) {
    log('✓ Search rate limiting is working!', 'green');
    return true;
  } else {
    log('⚠ Search rate limiting may not be working', 'yellow');
    return false;
  }
}

/**
 * Test Comments Rate Limit (20 requests/minute/user)
 */
async function testCommentsRateLimit(token, videoId) {
  log('\n=== Testing Comments Rate Limit (20 requests/minute/user) ===', 'blue');
  
  if (!token || !videoId) {
    log('⚠ Skipping comments test (no auth token or video ID)', 'yellow');
    return false;
  }
  
  let successCount = 0;
  let rateLimitedCount = 0;
  
  for (let i = 1; i <= 25; i++) {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/${videoId}/comments`,
        { text: `Test comment ${i}` },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      successCount++;
      log(`Request ${i}: ✓ Accepted (${response.status})`, 'green');
    } catch (error) {
      if (error.response?.status === 429) {
        rateLimitedCount++;
        const data = error.response.data;
        log(`Request ${i}: ✗ Rate Limited (${error.response.status})`, 'red');
        log(`  → Retry after: ${data.retryAfter}s`, 'yellow');
      } else {
        log(`Request ${i}: Error (${error.response?.status || error.message})`, 'red');
      }
    }
    
    await sleep(100);
  }
  
  log(`\nResults: ${successCount} accepted, ${rateLimitedCount} rate limited`, 'blue');
  
  if (rateLimitedCount > 0) {
    log('✓ Comments rate limiting is working!', 'green');
    return true;
  } else {
    log('⚠ Comments rate limiting may not be working', 'yellow');
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  log('╔════════════════════════════════════════╗', 'blue');
  log('║   Rate Limiting Test Suite            ║', 'blue');
  log('╚════════════════════════════════════════╝', 'blue');
  
  try {
    // Test 1: Auth Rate Limit
    const authResult = await testAuthRateLimit();
    
    await sleep(2000);
    
    // Test 2 & 3: Search and Comments (require auth)
    // Note: Uncomment if you have a test user and video
    /*
    log('\n=== Logging in for authenticated tests ===', 'blue');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
    const token = loginResponse.data.token;
    
    await sleep(2000);
    await testSearchRateLimit(token);
    
    await sleep(2000);
    await testCommentsRateLimit(token, 'your-video-id-here');
    */
    
    log('\n╔════════════════════════════════════════╗', 'blue');
    log('║   Test Summary                         ║', 'blue');
    log('╚════════════════════════════════════════╝', 'blue');
    
    if (authResult) {
      log('✓ Rate limiting is functional', 'green');
      log('✓ Redis is connected and working', 'green');
    } else {
      log('⚠ Rate limiting may not be working', 'yellow');
      log('  Check if Redis is running:', 'yellow');
      log('  docker ps | grep redis', 'yellow');
    }
    
  } catch (error) {
    log('\n✗ Test failed with error:', 'red');
    log(error.message, 'red');
    
    if (error.code === 'ECONNREFUSED') {
      log('\n⚠ Server is not running!', 'yellow');
      log('  Start server: cd server && npm start', 'yellow');
    }
  }
}

// Run tests
runTests();
