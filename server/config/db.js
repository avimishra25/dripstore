const mongoose = require('mongoose');
module.exports = async () => {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  const hello = await mongoose.connection.db.admin().command({ hello: 1 });
  if (!hello.setName && hello.msg !== 'isdbgrid') throw new Error('MongoDB replica set or sharded cluster required for payment transactions');
};
