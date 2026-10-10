require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
async function start() {
  for (const key of ['MONGO_URI', 'JWT_SECRET', 'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']) {
    if (!process.env[key]) throw new Error(`Missing required setting: ${key}`);
  }
  if (process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must have at least 32 characters');
  if (process.env.TRUST_PROXY_HOPS && !/^[1-9]\d?$/.test(process.env.TRUST_PROXY_HOPS)) throw new Error('Invalid TRUST_PROXY_HOPS');
  await connectDB();
  const app = require('./app');
  // Duplicate historic payment IDs fail startup instead of silently weakening uniqueness.
  await Promise.all([require('./models/Order').init(), require('./models/Cart').init(), require('./models/User').init(), require('./models/Product').init()]);
  const server = app.listen(process.env.PORT || 5000, () => console.log('DripStore API ready'));
  let closing = false;
  const shutdown = () => {
    if (closing) return;
    closing = true;
    const timer = setTimeout(() => process.exit(1), 10000); timer.unref();
    server.close(async () => { await mongoose.disconnect(); clearTimeout(timer); process.exit(0); });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
if (require.main === module) start().catch(async error => { console.error(error.message); await mongoose.disconnect(); process.exitCode = 1; });
module.exports = start;
