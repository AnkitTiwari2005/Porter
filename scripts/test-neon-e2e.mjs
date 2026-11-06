import { spawn } from 'node:child_process';
import http from 'node:http';

console.log('--- STARTING NEON E2E INTEGRATION TEST ---');

// Start backend server
const serverProcess = spawn('node', ['--env-file-if-exists=.env.local', '--env-file-if-exists=server/.env', 'server/src/index.js'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: true
});

serverProcess.stderr.on('data', (d) => process.stderr.write(d));

let started = false;
serverProcess.stdout.on('data', (data) => {
  const str = data.toString();
  process.stdout.write(str);
  if (str.includes('API listening on :4000')) {
    started = true;
    runTests();
  }
});

serverProcess.on('exit', (code) => {
  if (!started) {
    console.error(`Server failed to start, exit code: ${code}`);
    process.exit(1);
  }
});

async function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  try {
    console.log('\n[1/5] Testing GET /api/catalog (reading seeded vehicles & cities from Neon)...');
    const catalogRes = await request({
      hostname: 'localhost',
      port: 4000,
      path: '/api/catalog',
      method: 'GET'
    });
    console.log(`Status: ${catalogRes.status}, Vehicles in DB: ${catalogRes.body.vehicles?.length}`);
    if (catalogRes.status !== 200 || !catalogRes.body.vehicles?.length) throw new Error('Catalog failed');

    console.log('\n[2/5] Testing POST /api/auth/otp/request (Neon user OTP generation)...');
    const otpRes = await request({
      hostname: 'localhost',
      port: 4000,
      path: '/api/auth/otp/request',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' }
    }, { phone: '+919811797407' });
    console.log(`Status: ${otpRes.status}, devOtp: ${otpRes.body.devOtp}`);
    if (otpRes.status !== 200 || !otpRes.body.devOtp) throw new Error('OTP request failed');

    console.log('\n[3/5] Testing POST /api/auth/otp/verify (Neon user creation & session token)...');
    const verifyRes = await request({
      hostname: 'localhost',
      port: 4000,
      path: '/api/auth/otp/verify',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' }
    }, { phone: '+919811797407', code: otpRes.body.devOtp });
    console.log(`Status: ${verifyRes.status}, User ID: ${verifyRes.body.user?.id}, Role: ${verifyRes.body.user?.role}`);
    const setCookie = verifyRes.headers['set-cookie']?.[0];
    const cookie = setCookie ? setCookie.split(';')[0] : '';
    if (verifyRes.status !== 200 || !verifyRes.body.user) throw new Error('OTP verify failed');

    console.log('\n[4/5] Testing GET /api/me with session cookie (Neon token lookup)...');
    const meRes = await request({
      hostname: 'localhost',
      port: 4000,
      path: '/api/me',
      method: 'GET',
      headers: { 'Cookie': cookie }
    });
    console.log(`Status: ${meRes.status}, Authenticated Phone: ${meRes.body.user?.phone}`);
    if (meRes.status !== 200 || !meRes.body.user?.phone) throw new Error('Session me check failed');

    console.log('\n[5/5] Testing POST /api/quotes (Quote calculation against Neon rates)...');
    const quoteRes = await request({
      hostname: 'localhost',
      port: 4000,
      path: '/api/quotes',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000', 'Cookie': cookie }
    }, {
      serviceType: 'city',
      cityId: 'delhi',
      vehicleId: 'tata-ace',
      pickup: { address: 'Connaught Place, New Delhi', lat: 28.6315, lng: 77.2167 },
      drop: { address: 'Saket, New Delhi', lat: 28.5244, lng: 77.2066 }
    });
    console.log(`Status: ${quoteRes.status}, Quoted Total: ₹${quoteRes.body.pricing?.total}, Distance: ${quoteRes.body.distanceKm} km`);
    if (quoteRes.status !== 200 || !quoteRes.body.pricing) throw new Error('Quote test failed');

    console.log('\n--- ALL NEON E2E TESTS PASSED SUCCESSFULLY! ---');
  } catch (err) {
    console.error('\nE2E Test Failed:', err);
    process.exitCode = 1;
  } finally {
    serverProcess.kill();
    process.exit(process.exitCode || 0);
  }
}
