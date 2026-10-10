// Dedicated demo launcher: never loads .env or connects to MONGO_URI.
const crypto = require('crypto');
const mongoose = require('mongoose');
const hosted = process.argv.includes('--hosted');
const port = Number(process.env.PORT || (hosted ? 10000 : 5000));
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer from 1 to 65535');
process.env.JWT_SECRET = crypto.randomBytes(48).toString('hex');
if (hosted) process.env.DEMO_SERVE_CLIENT = 'true';
else process.env.CLIENT_URL = 'http://localhost:3000';
(async () => {
  if (hosted && !require('fs').existsSync(require('path').resolve(__dirname, '../client/build/index.html'))) throw new Error('Run npm run build:demo first');
  const replica = await require('./demo/runtime').startDatabase();
  let server;
  let closing = false;
  const close = async () => {
    if (closing) return; closing = true;
    if (server) await new Promise(resolve => server.close(resolve));
    await mongoose.disconnect(); await replica.stop();
  };
  try {
    server = require('./app').listen(port, hosted ? '0.0.0.0' : '127.0.0.1', () => console.log('DEMO ready on port ' + port + '. Sample data only; resets on every restart.'));
    server.on('error', async error => { console.error(error.message); await close(); process.exitCode = 1; });
    for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => close().catch(console.error));
  } catch (error) { await close(); throw error; }
})().catch(error => { console.error(error); process.exitCode = 1; });
