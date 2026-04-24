const axios = require('axios');
const { pool } = require('./src/config/database');

const API_BASE_URL = 'http://localhost:3001/api';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'testpassword123';

// Test data
const testUser = {
  firstName: 'Test',
  lastName: 'User',
  email: TEST_EMAIL,
  password: TEST_PASSWORD,
  confirmPassword: TEST_PASSWORD,
  companyName: 'Test Company',
  phone: '+1234567890'
};

let authToken = null;
let resetToken = null;

async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Database connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function testServerHealth() {
  try {
    console.log('🔍 Testing server health...');
    const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`);
    console.log('✅ Server is running!');
    console.log('   Status:', response.data.status);
    console.log('   Service:', response.data.service);
    return true;
  } catch (error) {
    console.error('❌ Server health check failed:', error.message);
    return false;
  }
}

async function testSignup() {
  try {
    console.log('\n🔍 Testing user signup...');
    const response = await axios.post(`${API_BASE_URL}/auth/signup`, testUser);
    
    if (response.data.success) {
      console.log('✅ Signup successful!');
      console.log('   User ID:', response.data.user.id);
      console.log('   Email:', response.data.user.email);
      authToken = response.data.token;
      return true;
    } else {
      console.error('❌ Signup failed:', response.data.error);
      return false;
    }
  } catch (error) {
    if (error.response?.data?.error?.includes('already exists')) {
      console.log('ℹ️ User already exists, proceeding with login test...');
      return true;
    }
    console.error('❌ Signup test failed:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testLogin() {
  try {
    console.log('\n🔍 Testing user login...');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    if (response.data.success) {
      console.log('✅ Login successful!');
      console.log('   User ID:', response.data.user.id);
      console.log('   Plan Type:', response.data.user.planType);
      authToken = response.data.token;
      return true;
    } else {
      console.error('❌ Login failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Login test failed:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testTokenVerification() {
  try {
    console.log('\n🔍 Testing token verification...');
    const response = await axios.post(`${API_BASE_URL}/auth/verify`, {
      token: authToken
    });
    
    if (response.data.success) {
      console.log('✅ Token verification successful!');
      console.log('   User ID:', response.data.user.id);
      return true;
    } else {
      console.error('❌ Token verification failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Token verification test failed:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testUserProfile() {
  try {
    console.log('\n🔍 Testing user profile access...');
    const response = await axios.get(`${API_BASE_URL}/user/profile`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.data.success) {
      console.log('✅ Profile access successful!');
      console.log('   Name:', `${response.data.user.firstName} ${response.data.user.lastName}`);
      console.log('   Company:', response.data.user.companyName);
      console.log('   Plan:', response.data.user.planType);
      return true;
    } else {
      console.error('❌ Profile access failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Profile access test failed:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testForgotPassword() {
  try {
    console.log('\n🔍 Testing forgot password...');
    const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
      email: TEST_EMAIL
    });
    
    if (response.data.success) {
      console.log('✅ Forgot password request successful!');
      console.log('   Message:', response.data.message);
      
      // In a real test, you'd check the database for the reset token
      // For now, we'll simulate getting the token
      const tokenResult = await pool.query(
        'SELECT reset_token FROM users WHERE email = $1',
        [TEST_EMAIL]
      );
      
      if (tokenResult.rows[0]?.reset_token) {
        resetToken = tokenResult.rows[0].reset_token;
        console.log('   Reset token generated (simulated)');
        return true;
      } else {
        console.log('   No reset token found in database');
        return false;
      }
    } else {
      console.error('❌ Forgot password failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Forgot password test failed:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testResetPassword() {
  if (!resetToken) {
    console.log('\n⚠️ Skipping password reset test (no reset token available)');
    return true;
  }
  
  try {
    console.log('\n🔍 Testing password reset...');
    const newPassword = 'newpassword123';
    const response = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
      token: resetToken,
      newPassword: newPassword
    });
    
    if (response.data.success) {
      console.log('✅ Password reset successful!');
      console.log('   Message:', response.data.message);
      
      // Test login with new password
      console.log('\n🔍 Testing login with new password...');
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: TEST_EMAIL,
        password: newPassword
      });
      
      if (loginResponse.data.success) {
        console.log('✅ Login with new password successful!');
        authToken = loginResponse.data.token;
        return true;
      } else {
        console.error('❌ Login with new password failed:', loginResponse.data.error);
        return false;
      }
    } else {
      console.error('❌ Password reset failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Password reset test failed:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testLogout() {
  try {
    console.log('\n🔍 Testing logout...');
    const response = await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.data.success) {
      console.log('✅ Logout successful!');
      console.log('   Message:', response.data.message);
      return true;
    } else {
      console.error('❌ Logout failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Logout test failed:', error.response?.data?.error || error.message);
    return false;
  }
}

async function cleanupTestData() {
  try {
    console.log('\n🧹 Cleaning up test data...');
    await pool.query('DELETE FROM users WHERE email = $1', [TEST_EMAIL]);
    console.log('✅ Test data cleaned up!');
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Starting SiteScout Authentication System Tests\n');
  
  const tests = [
    { name: 'Database Connection', fn: testDatabaseConnection },
    { name: 'Server Health', fn: testServerHealth },
    { name: 'User Signup', fn: testSignup },
    { name: 'User Login', fn: testLogin },
    { name: 'Token Verification', fn: testTokenVerification },
    { name: 'User Profile Access', fn: testUserProfile },
    { name: 'Forgot Password', fn: testForgotPassword },
    { name: 'Reset Password', fn: testResetPassword },
    { name: 'User Logout', fn: testLogout }
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passedTests++;
      }
    } catch (error) {
      console.error(`❌ ${test.name} test crashed:`, error.message);
    }
  }
  
  console.log('\n📊 Test Results:');
  console.log(`   Passed: ${passedTests}/${totalTests}`);
  console.log(`   Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Authentication system is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the errors above.');
  }
  
  await cleanupTestData();
  await pool.end();
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('💥 Test suite crashed:', error);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testDatabaseConnection,
  testServerHealth,
  testSignup,
  testLogin,
  testTokenVerification,
  testUserProfile,
  testForgotPassword,
  testResetPassword,
  testLogout
};
