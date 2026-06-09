const jwt = require('jsonwebtoken');
const http = require('http');

async function run() {
  const token = jwt.sign({ id: 2, role: 'owner' }, 'disibin', { expiresIn: '7d' });
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/control/analytics',
    method: 'GET',
    headers: {
      'Cookie': `disibin=${token}`
    }
  };

  const req = http.request(options, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log('Response:', data));
  });

  req.on('error', error => console.error(error));
  req.end();
}

run();
