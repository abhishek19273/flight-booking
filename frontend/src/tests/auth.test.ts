import { supabase } from '../services/supabaseClient';

/**
 * This is a simple test script to verify Supabase Auth integration.
 * In a real application, you would use a testing framework like Jest or Vitest.
 */

// Test user credentials - DO NOT use real credentials here
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'test_password_123';
const TEST_FIRST_NAME = 'Test';
const TEST_LAST_NAME = 'User';

// Helper function to log test results
const logResult = (testName: string, success: boolean, error?: any) => {
  if (success) {
    console.log(`✅ ${testName} - PASSED`);
  } else {
    console.error(`❌ ${testName} - FAILED: ${error?.message || JSON.stringify(error) || 'Unknown error'}`);
  }
};

// Test sign up functionality
async function testSignUp() {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      options: {
        data: {
          first_name: TEST_FIRST_NAME,
          last_name: TEST_LAST_NAME
        }
      }
    });
    
    if (error) throw error;
    logResult('Sign Up', true);
    return data;
  } catch (error) {
    logResult('Sign Up', false, error);
    return null;
  }
}

// Test sign in functionality
async function testSignIn() {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    if (error) throw error;
    logResult('Sign In', true);
    return data;
  } catch (error) {
    logResult('Sign In', false, error);
    return null;
  }
}

// Test get user functionality
async function testGetUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    
    if (error) throw error;
    logResult('Get User', true);
    return data;
  } catch (error) {
    logResult('Get User', false, error);
    return null;
  }
}

// Test password reset request
async function testPasswordResetRequest() {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(TEST_EMAIL, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    
    if (error) throw error;
    logResult('Password Reset Request', true);
    return true;
  } catch (error) {
    logResult('Password Reset Request', false, error);
    return false;
  }
}

// Test sign out functionality
async function testSignOut() {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) throw error;
    logResult('Sign Out', true);
    return true;
  } catch (error) {
    logResult('Sign Out', false, error);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🧪 Starting Supabase Auth Integration Tests...');
  
  // Sign up a test user
  await testSignUp();
  
  // Sign in with the test user
  const signInData = await testSignIn();
  if (!signInData) {
    console.error('❌ Cannot proceed with tests: Sign in failed');
    return;
  }
  
  // Get the current user
  await testGetUser();
  
  // Request a password reset
  await testPasswordResetRequest();
  
  // Sign out
  await testSignOut();
  
  console.log('🧪 All tests completed!');
}

// Export the test functions for use in the application
export {
  runTests,
  testSignUp,
  testSignIn,
  testGetUser,
  testPasswordResetRequest,
  testSignOut
};

// Uncomment to run tests directly
// runTests();
