// Frontend Authentication Test Script
// This script tests the frontend authentication integration

const API_BASE_URL = 'http://localhost:3001/api';
const TEST_EMAIL = 'frontend-test@example.com';
const TEST_PASSWORD = 'frontendtest123';

// Test data
const testUser = {
  firstName: 'Frontend',
  lastName: 'Test',
  email: TEST_EMAIL,
  password: TEST_PASSWORD,
  confirmPassword: TEST_PASSWORD,
  companyName: 'Frontend Test Company',
  phone: '+1234567890'
};

async function testFrontendAPI() {
  console.log('🧪 Testing Frontend API Integration\n');
  
  try {
    // Test 1: Signup
    console.log('1️⃣ Testing signup...');
    const signupResponse = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });
    
    const signupData = await signupResponse.json();
    
    if (signupResponse.ok && signupData.success) {
      console.log('✅ Signup successful');
      console.log('   User ID:', signupData.user.id);
      console.log('   Token received:', !!signupData.token);
    } else {
      if (signupData.error?.includes('already exists')) {
        console.log('ℹ️ User already exists, proceeding...');
      } else {
        console.log('❌ Signup failed:', signupData.error);
        return false;
      }
    }
    
    // Test 2: Login
    console.log('\n2️⃣ Testing login...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      }),
    });
    
    const loginData = await loginResponse.json();
    
    if (loginResponse.ok && loginData.success) {
      console.log('✅ Login successful');
      console.log('   User ID:', loginData.user.id);
      console.log('   Plan Type:', loginData.user.planType);
      
      const token = loginData.token;
      
      // Test 3: Token verification
      console.log('\n3️⃣ Testing token verification...');
      const verifyResponse = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
      
      const verifyData = await verifyResponse.json();
      
      if (verifyResponse.ok && verifyData.success) {
        console.log('✅ Token verification successful');
        console.log('   User ID:', verifyData.user.id);
      } else {
        console.log('❌ Token verification failed:', verifyData.error);
        return false;
      }
      
      // Test 4: Profile access
      console.log('\n4️⃣ Testing profile access...');
      const profileResponse = await fetch(`${API_BASE_URL}/user/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const profileData = await profileResponse.json();
      
      if (profileResponse.ok && profileData.success) {
        console.log('✅ Profile access successful');
        console.log('   Name:', `${profileData.user.firstName} ${profileData.user.lastName}`);
        console.log('   Company:', profileData.user.companyName);
      } else {
        console.log('❌ Profile access failed:', profileData.error);
        return false;
      }
      
      // Test 5: Forgot password
      console.log('\n5️⃣ Testing forgot password...');
      const forgotResponse = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: TEST_EMAIL }),
      });
      
      const forgotData = await forgotResponse.json();
      
      if (forgotResponse.ok && forgotData.success) {
        console.log('✅ Forgot password successful');
        console.log('   Message:', forgotData.message);
      } else {
        console.log('❌ Forgot password failed:', forgotData.error);
        return false;
      }
      
      // Test 6: Logout
      console.log('\n6️⃣ Testing logout...');
      const logoutResponse = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const logoutData = await logoutResponse.json();
      
      if (logoutResponse.ok && logoutData.success) {
        console.log('✅ Logout successful');
        console.log('   Message:', logoutData.message);
      } else {
        console.log('❌ Logout failed:', logoutData.error);
        return false;
      }
      
    } else {
      console.log('❌ Login failed:', loginData.error);
      return false;
    }
    
    console.log('\n🎉 All frontend API tests passed!');
    return true;
    
  } catch (error) {
    console.error('💥 Frontend API test failed:', error.message);
    return false;
  }
}

async function testLocalStorage() {
  console.log('\n🧪 Testing LocalStorage Integration\n');
  
  try {
    // Test localStorage operations
    const testData = {
      token: 'test-token-123',
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      }
    };
    
    // Test setting data
    localStorage.setItem('sitescout_token', testData.token);
    localStorage.setItem('sitescout_user', JSON.stringify(testData.user));
    console.log('✅ LocalStorage set operations successful');
    
    // Test getting data
    const retrievedToken = localStorage.getItem('sitescout_token');
    const retrievedUser = JSON.parse(localStorage.getItem('sitescout_user') || '{}');
    
    if (retrievedToken === testData.token && retrievedUser.id === testData.user.id) {
      console.log('✅ LocalStorage get operations successful');
    } else {
      console.log('❌ LocalStorage get operations failed');
      return false;
    }
    
    // Test removing data
    localStorage.removeItem('sitescout_token');
    localStorage.removeItem('sitescout_user');
    
    if (!localStorage.getItem('sitescout_token') && !localStorage.getItem('sitescout_user')) {
      console.log('✅ LocalStorage remove operations successful');
    } else {
      console.log('❌ LocalStorage remove operations failed');
      return false;
    }
    
    console.log('🎉 All LocalStorage tests passed!');
    return true;
    
  } catch (error) {
    console.error('💥 LocalStorage test failed:', error.message);
    return false;
  }
}

async function runFrontendTests() {
  console.log('🚀 Starting Frontend Authentication Tests\n');
  
  const tests = [
    { name: 'API Integration', fn: testFrontendAPI },
    { name: 'LocalStorage', fn: testLocalStorage }
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
  
  console.log('\n📊 Frontend Test Results:');
  console.log(`   Passed: ${passedTests}/${totalTests}`);
  console.log(`   Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All frontend tests passed! Frontend authentication is working correctly.');
  } else {
    console.log('\n⚠️ Some frontend tests failed. Please check the errors above.');
  }
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  // Node.js environment
  runFrontendTests().catch(error => {
    console.error('💥 Frontend test suite crashed:', error);
    process.exit(1);
  });
} else {
  // Browser environment
  runFrontendTests();
}

module.exports = {
  runFrontendTests,
  testFrontendAPI,
  testLocalStorage
};
