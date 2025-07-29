const express = require('express');

const app = express();
const PORT = 3001;

app.get('/test', (req, res) => {
  res.json({ success: true, message: 'Test server working' });
});

console.log('🚀 Starting simple test server...');

app.listen(PORT, () => {
  console.log(`✅ Test server running on http://localhost:${PORT}/test`);
});

console.log('✅ Server startup completed');
