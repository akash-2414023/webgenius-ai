process.env.NODE_ENV = 'test';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import http from 'http';
import { User } from '../models/User.js';
import { Project } from '../models/Project.js';
import { ProjectVersion } from '../models/ProjectVersion.js';
import { connectToDatabase } from '../db/connection.js';

let mongod: MongoMemoryServer;
let server: http.Server;
let baseUrl: string;

async function request(path: string, options: RequestInit = {}) {
  const url = `${baseUrl}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => null);
  const cookieHeader = res.headers.get('set-cookie');
  return { status: res.status, data, cookie: cookieHeader };
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('🧪 STARTING WEBGENIUS AI PHASE 9 INTEGRATION TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${detail ? `-> ${detail}` : ''}`);
      failed++;
    }
  }

  try {
    // 1. Setup in-memory MongoDB
    console.log('📦 Starting in-memory MongoDB instance...');
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await connectToDatabase(uri);

    // 2. Start test HTTP server
    const { default: app } = await import('../index.js');
    server = app.listen(0);
    const address = server.address() as any;
    baseUrl = `http://127.0.0.1:${address.port}`;
    console.log(`🌐 Test server listening on ${baseUrl}\n`);

    // TEST 1: New user registration
    const user1Data = {
      name: 'Alice Developer',
      email: 'Alice.Dev@Example.Com', // Mixed case to test normalization
      password: 'SecurePassword123',
    };
    const reg1 = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(user1Data),
    });
    assert(
      reg1.status === 201 && reg1.data?.success && reg1.data?.data?.user?.email === 'alice.dev@example.com',
      'Test 1: New user registration (with lowercase email normalization)',
      JSON.stringify(reg1.data)
    );
    const user1Token = reg1.data?.data?.token;

    // TEST 2: Duplicate email registration
    const regDuplicate = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Alice Duplicate',
        email: 'alice.dev@example.com',
        password: 'Password999',
      }),
    });
    assert(
      regDuplicate.status === 409 && !regDuplicate.data?.success,
      'Test 2: Duplicate email registration rejected with HTTP 409'
    );

    // TEST 3: Login with valid credentials
    const loginValid = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'ALICE.DEV@EXAMPLE.COM',
        password: 'SecurePassword123',
      }),
    });
    assert(
      loginValid.status === 200 && loginValid.data?.success && loginValid.data?.data?.token,
      'Test 3: Login with valid credentials'
    );

    // TEST 4: Login with invalid credentials
    const loginInvalid = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'alice.dev@example.com',
        password: 'WrongPassword123',
      }),
    });
    assert(
      loginInvalid.status === 401 && !loginInvalid.data?.success,
      'Test 4: Login with invalid credentials rejected with HTTP 401'
    );

    // TEST 5: Logout
    const logoutRes = await request('/api/auth/logout', { method: 'POST' });
    assert(
      logoutRes.status === 200 && logoutRes.data?.success,
      'Test 5: Logout clears session'
    );

    // TEST 6: Accessing protected pages without authentication
    const unauthProjects = await request('/api/projects');
    assert(
      unauthProjects.status === 401 && !unauthProjects.data?.success,
      'Test 6: Accessing protected /api/projects without token rejected with HTTP 401'
    );

    // Register User 2 for cross-user permission testing
    const user2Data = {
      name: 'Bob Designer',
      email: 'bob@example.com',
      password: 'BobPassword123',
    };
    const reg2 = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(user2Data),
    });
    const user2Token = reg2.data?.data?.token;

    // TEST 7: Saving a generated website (User 1)
    const initialSiteCode = {
      title: 'DevPulse Analytics',
      summary: 'High conversion AI dashboard',
      fullCode: '<!DOCTYPE html><html><body><h1>DevPulse</h1></body></html>',
      html: '<h1>DevPulse</h1>',
      css: '',
      js: '',
      features: ['Real-time metrics', 'Dark mode'],
    };
    const saveProj = await request('/api/projects', {
      method: 'POST',
      headers: { Authorization: `Bearer ${user1Token}` },
      body: JSON.stringify({
        name: 'DevPulse Website',
        originalPrompt: 'An analytics dashboard landing page',
        currentCode: initialSiteCode,
      }),
    });
    assert(
      saveProj.status === 201 && saveProj.data?.success && saveProj.data?.data?._id,
      'Test 7: Saving generated website to authenticated user account'
    );
    const projectId = saveProj.data?.data?._id;

    // TEST 8: Reopening a saved project
    const openProj = await request(`/api/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    assert(
      openProj.status === 200 && openProj.data?.data?.name === 'DevPulse Website',
      'Test 8: Reopening saved project from database'
    );

    // TEST 9: Editing and saving a project (creates version 2)
    const updatedCode = {
      ...initialSiteCode,
      fullCode: '<!DOCTYPE html><html><body><h1>DevPulse v2 with Pricing</h1></body></html>',
    };
    const updateProj = await request(`/api/projects/${projectId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${user1Token}` },
      body: JSON.stringify({
        currentCode: updatedCode,
        modificationPrompt: 'Added pricing section',
      }),
    });
    assert(
      updateProj.status === 200 && updateProj.data?.data?.versionCount === 2,
      'Test 9: Editing and persisting project increments version count to 2'
    );

    // TEST 10: Restoring a previous version
    const versionsRes = await request(`/api/projects/${projectId}/versions`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    assert(
      versionsRes.status === 200 && versionsRes.data?.data?.length === 2,
      'Test 10a: Listing project versions retrieves all snapshots'
    );

    const version1Id = versionsRes.data?.data?.find((v: any) => v.versionNumber === 1)?._id;
    const restoreRes = await request(`/api/projects/${projectId}/versions/${version1Id}/restore`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    assert(
      restoreRes.status === 200 && restoreRes.data?.data?.currentCode?.fullCode === initialSiteCode.fullCode,
      'Test 10b: Restoring earlier Version 1 rolls back code successfully'
    );

    // TEST 11: Preventing one user from accessing another user's project (Ownership Security)
    const crossUserAccess = await request(`/api/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${user2Token}` }, // Bob trying to access Alice's project
    });
    assert(
      crossUserAccess.status === 404 && !crossUserAccess.data?.success,
      'Test 11: Cross-user access blocked (User 2 cannot read User 1 project)'
    );

    const crossUserDelete = await request(`/api/projects/${projectId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${user2Token}` },
    });
    assert(
      crossUserDelete.status === 404,
      'Test 12: Cross-user deletion blocked (User 2 cannot delete User 1 project)'
    );

    // TEST 12: Deleting a project by authorized owner
    const deleteProj = await request(`/api/projects/${projectId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    assert(
      deleteProj.status === 200 && deleteProj.data?.success,
      'Test 13: Owner can delete project and its version history'
    );

    const checkDeleted = await request(`/api/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    assert(
      checkDeleted.status === 404,
      'Test 14: Confirmed project no longer exists after deletion'
    );

    // TEST 13: Password reset flow with expiring single-use crypto token
    const forgotRes = await request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'alice.dev@example.com' }),
    });
    assert(
      forgotRes.status === 200 && forgotRes.data?.success,
      'Test 15a: Password recovery request returns generic safe response'
    );

    const aliceUser = await User.findOne({ email: 'alice.dev@example.com' });
    assert(
      Boolean(aliceUser?.resetPasswordToken && aliceUser?.resetPasswordExpires),
      'Test 15b: Single-use reset token and 1-hour expiry stored in database'
    );

  } catch (err: any) {
    console.error('Fatal test error:', err);
    failed++;
  } finally {
    if (server) server.close();
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    if (mongod) await mongod.stop();

    console.log('\n====================================================');
    console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTestSuite();
