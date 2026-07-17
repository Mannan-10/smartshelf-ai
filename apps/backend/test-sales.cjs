const http = require('http');

const data = JSON.stringify({
  items: [
    {
      productId: "cmqg9x47z000140v2zne53zny", // We'll just pass a fake ID, if it returns 400 "Product does not exist", we know validation passed!
      quantity: 1,
      unitPrice: 10
    }
  ]
});

const req = http.request({
  hostname: 'localhost',
  port: 4000,
  path: '/sales',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', body);
  });
});

req.on('error', e => console.error(e));
req.write(data);
req.end();
