const res = await fetch('http://localhost:5001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    identifier: '210211100219',
    password: 'FEB-UTM-2026'
  })
});
const data = await res.json();
console.log('Login Status:', res.status);
console.log('Login Response:', JSON.stringify(data, null, 2));
