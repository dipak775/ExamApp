
import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// 1. Test Configuration
export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up to 100 users over 2 minutes
    { duration: '3m', target: 100 },  // Stay at 100 users for 3 minutes
    { duration: '2m', target: 500 },  // Ramp up to 500 users over 2 minutes
    { duration: '3m', target: 500 },  // Stay at 500 users for 3 minutes
    { duration: '2m', target: 1000 }, // Ramp up to 1000 users over 2 minutes
    { duration: '3m', target: 1000 }, // Stay at 1000 users for 3 minutes
    { duration: '5m', target: 0 },    // Ramp down to 0 users over 5 minutes
  ],
  thresholds: {
    'http_req_failed': ['rate<0.01'], // Error rate should be less than 1%
    'http_req_duration': ['p(95)<500'], // 95th percentile response time should be below 500ms
  },
};

// 2. Test Environment
const BASE_URL = 'https://YOUR-APP-LINK.com'; // Replace with your actual app URL
const EXAM_ID = '123'; // Sample Exam ID
const QUESTION_ID = '1'; // Sample Question ID

// Sample user credentials
const USER_CREDENTIALS = {
  email: 'student@example.com', // Use a valid test user
  password: 'password123',
};

// 3. VU Code (User Journey)
export default function () {
  let authToken;

  // Group for login action
  group('User Login', function () {
    const loginPayload = JSON.stringify(USER_CREDENTIALS);
    const loginHeaders = { 'Content-Type': 'application/json' };

    const res = http.post(`${BASE_URL}/api/auth/login`, loginPayload, { headers: loginHeaders });

    check(res, {
      'Login successful': (r) => r.status === 200,
      'Auth token received': (r) => r.json('token') !== null,
    });

    // Extract auth token for subsequent requests
    if (res.json('token')) {
      authToken = res.json('token');
    }
  });

  // Only proceed if login was successful
  if (!authToken) {
    console.error('Login failed, VU exiting.');
    return;
  }

  const authHeaders = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json',
  };

  // Add think time
  sleep(randomIntBetween(2, 5));

  // Group for exam-related actions
  group('Take Exam', function () {
    // Fetch exam details
    group('Fetch Exam Details', function () {
      const res = http.get(`${BASE_URL}/api/exams/${EXAM_ID}`, { headers: authHeaders });
      check(res, { 'Fetched exam details': (r) => r.status === 200 });
    });

    sleep(randomIntBetween(2, 5));

    // Fetch one question
    group('Fetch Question', function () {
      const res = http.get(`${BASE_URL}/api/exams/${EXAM_ID}/questions/${QUESTION_ID}`, { headers: authHeaders });
      check(res, { 'Fetched question': (r) => r.status === 200 });
    });

    sleep(randomIntBetween(2, 5));

    // Submit one answer
    group('Submit Answer', function () {
      const answerPayload = JSON.stringify({ answer: 'A' });
      const res = http.post(`${BASE_URL}/api/exams/${EXAM_ID}/answers`, answerPayload, { headers: authHeaders });
      check(res, { 'Submitted answer': (r) => r.status === 200 });
    });

    sleep(randomIntBetween(2, 5));

    // Submit the whole exam
    group('Submit Exam', function () {
      const res = http.post(`${BASE_URL}/api/exams/${EXAM_ID}/submit`, null, { headers: authHeaders });
      check(res, { 'Submitted exam': (r) => r.status === 200 });
    });
  });
}
