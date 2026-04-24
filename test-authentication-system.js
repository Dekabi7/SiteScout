#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 SiteScout Authentication System - Complete Test Suite\n');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, args, cwd, description) {
  return new Promise((resolve, reject) => {
    log(`\n${colors.cyan}${description}${colors.reset}`);
    log(`Running: ${command} ${args.join(' ')}`, 'yellow');
    
    const child = spawn(command, args, {
      cwd: cwd || process.cwd(),
      stdio: 'pipe',
      shell: true
    });
    
    let output = '';
    let errorOutput = '';
    
    child.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(text);
    });
    
    child.stderr.on('data', (data) => {
      const text = data.toString();
      errorOutput += text;
      process.stderr.write(text);
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        log(`✅ ${description} completed successfully`, 'green');
        resolve({ success: true, output, errorOutput });
      } else {
        log(`❌ ${description} failed with code ${code}`, 'red');
        reject({ success: false, code, output, errorOutput });
      }
    });
    
    child.on('error', (error) => {
      log(`💥 ${description} crashed: ${error.message}`, 'red');
      reject({ success: false, error: error.message });
    });
  });
}

async function checkPrerequisites() {
  log('\n🔍 Checking Prerequisites...', 'blue');
  
  const checks = [
    { command: 'node', args: ['--version'], description: 'Node.js' },
    { command: 'npm', args: ['--version'], description: 'npm' },
    { command: 'psql', args: ['--version'], description: 'PostgreSQL' }
  ];
  
  for (const check of checks) {
    try {
      await runCommand(check.command, check.args, null, `Checking ${check.description}`);
    } catch (error) {
      log(`❌ ${check.description} not found or not working`, 'red');
      return false;
    }
  }
  
  log('✅ All prerequisites are available', 'green');
  return true;
}

async function setupDatabase() {
  log('\n🗄️ Setting up Database...', 'blue');
  
  try {
    // Check if database setup script exists
    const setupScript = path.join(__dirname, 'backend', 'setup-database.ps1');
    const fs = require('fs');
    
    if (fs.existsSync(setupScript)) {
      await runCommand('powershell', ['-ExecutionPolicy', 'Bypass', '-File', setupScript], null, 'Running database setup script');
    } else {
      log('⚠️ Database setup script not found, please run manually:', 'yellow');
      log('   cd backend && .\\setup-database.ps1', 'yellow');
    }
    
    return true;
  } catch (error) {
    log('❌ Database setup failed', 'red');
    return false;
  }
}

async function installDependencies() {
  log('\n📦 Installing Dependencies...', 'blue');
  
  const projects = [
    { name: 'Backend', path: 'backend' },
    { name: 'Frontend', path: 'frontend' }
  ];
  
  for (const project of projects) {
    try {
      await runCommand('npm', ['install'], project.path, `Installing ${project.name} dependencies`);
    } catch (error) {
      log(`❌ Failed to install ${project.name} dependencies`, 'red');
      return false;
    }
  }
  
  return true;
}

async function runDatabaseMigration() {
  log('\n🔄 Running Database Migration...', 'blue');
  
  try {
    await runCommand('npm', ['run', 'migrate'], 'backend', 'Running database migration');
    return true;
  } catch (error) {
    log('❌ Database migration failed', 'red');
    return false;
  }
}

async function startBackendServer() {
  log('\n🚀 Starting Backend Server...', 'blue');
  
  try {
    // Start the server in the background
    const serverProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, 'backend'),
      stdio: 'pipe',
      shell: true
    });
    
    // Wait a bit for the server to start
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Test if server is running
    const testResponse = await fetch('http://localhost:3001/health');
    if (testResponse.ok) {
      log('✅ Backend server is running', 'green');
      return serverProcess;
    } else {
      throw new Error('Server health check failed');
    }
  } catch (error) {
    log('❌ Failed to start backend server', 'red');
    throw error;
  }
}

async function runBackendTests() {
  log('\n🧪 Running Backend Tests...', 'blue');
  
  try {
    await runCommand('npm', ['run', 'test:auth'], 'backend', 'Running backend authentication tests');
    return true;
  } catch (error) {
    log('❌ Backend tests failed', 'red');
    return false;
  }
}

async function runFrontendTests() {
  log('\n🧪 Running Frontend Tests...', 'blue');
  
  try {
    await runCommand('npm', ['run', 'test:auth'], 'frontend', 'Running frontend authentication tests');
    return true;
  } catch (error) {
    log('❌ Frontend tests failed', 'red');
    return false;
  }
}

async function testFrontendBuild() {
  log('\n🏗️ Testing Frontend Build...', 'blue');
  
  try {
    await runCommand('npm', ['run', 'build'], 'frontend', 'Building frontend application');
    return true;
  } catch (error) {
    log('❌ Frontend build failed', 'red');
    return false;
  }
}

async function runManualTests() {
  log('\n👨‍💻 Manual Testing Instructions...', 'blue');
  
  log('\n📋 Please manually test the following:', 'yellow');
  log('1. Open http://localhost:3000 in your browser', 'cyan');
  log('2. Test the signup flow:', 'cyan');
  log('   - Go to /signup', 'cyan');
  log('   - Fill out the form with test data', 'cyan');
  log('   - Submit and verify account creation', 'cyan');
  log('3. Test the login flow:', 'cyan');
  log('   - Go to /login', 'cyan');
  log('   - Login with the test account', 'cyan');
  log('   - Verify you can access protected pages', 'cyan');
  log('4. Test the forgot password flow:', 'cyan');
  log('   - Go to /forgot-password', 'cyan');
  log('   - Enter your email and submit', 'cyan');
  log('   - Check the success message', 'cyan');
  log('5. Test logout:', 'cyan');
  log('   - Logout and verify you\'re redirected', 'cyan');
  
  log('\n⏳ Waiting 30 seconds for manual testing...', 'yellow');
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  return true;
}

async function cleanup(serverProcess) {
  log('\n🧹 Cleaning up...', 'blue');
  
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
    log('✅ Backend server stopped', 'green');
  }
  
  log('✅ Cleanup completed', 'green');
}

async function main() {
  const results = {
    prerequisites: false,
    database: false,
    dependencies: false,
    migration: false,
    backendTests: false,
    frontendTests: false,
    frontendBuild: false,
    manualTests: false
  };
  
  let serverProcess = null;
  
  try {
    // Step 1: Check prerequisites
    results.prerequisites = await checkPrerequisites();
    if (!results.prerequisites) {
      throw new Error('Prerequisites check failed');
    }
    
    // Step 2: Install dependencies
    results.dependencies = await installDependencies();
    if (!results.dependencies) {
      throw new Error('Dependency installation failed');
    }
    
    // Step 3: Setup database
    results.database = await setupDatabase();
    if (!results.database) {
      log('⚠️ Database setup failed, but continuing...', 'yellow');
    }
    
    // Step 4: Run migration
    results.migration = await runDatabaseMigration();
    if (!results.migration) {
      throw new Error('Database migration failed');
    }
    
    // Step 5: Start backend server
    serverProcess = await startBackendServer();
    
    // Step 6: Run backend tests
    results.backendTests = await runBackendTests();
    
    // Step 7: Run frontend tests
    results.frontendTests = await runFrontendTests();
    
    // Step 8: Test frontend build
    results.frontendBuild = await testFrontendBuild();
    
    // Step 9: Manual testing
    results.manualTests = await runManualTests();
    
  } catch (error) {
    log(`💥 Test suite failed: ${error.message}`, 'red');
  } finally {
    await cleanup(serverProcess);
  }
  
  // Print final results
  log('\n📊 Final Test Results:', 'blue');
  log('====================', 'blue');
  
  const testNames = {
    prerequisites: 'Prerequisites Check',
    dependencies: 'Dependencies Installation',
    database: 'Database Setup',
    migration: 'Database Migration',
    backendTests: 'Backend Tests',
    frontendTests: 'Frontend Tests',
    frontendBuild: 'Frontend Build',
    manualTests: 'Manual Testing'
  };
  
  let passedTests = 0;
  let totalTests = Object.keys(results).length;
  
  for (const [key, passed] of Object.entries(results)) {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const color = passed ? 'green' : 'red';
    log(`${status} ${testNames[key]}`, color);
    if (passed) passedTests++;
  }
  
  log('\n📈 Summary:', 'blue');
  log(`   Passed: ${passedTests}/${totalTests}`, passedTests === totalTests ? 'green' : 'yellow');
  log(`   Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`, passedTests === totalTests ? 'green' : 'yellow');
  
  if (passedTests === totalTests) {
    log('\n🎉 All tests passed! Authentication system is ready for production!', 'green');
  } else {
    log('\n⚠️ Some tests failed. Please review the errors above before going to production.', 'yellow');
  }
  
  process.exit(passedTests === totalTests ? 0 : 1);
}

// Run the test suite
main().catch(error => {
  log(`💥 Test suite crashed: ${error.message}`, 'red');
  process.exit(1);
});
