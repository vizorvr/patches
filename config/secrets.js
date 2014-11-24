module.exports = {
  db: process.env.MONGODB || 'mongodb://localhost:27017/engi',
  gridFs: process.env.GRIDFS || 'mongodb://localhost:27017/engi-assets',
  sessionSecret: process.env.SESSION_SECRET || 'engi'
};
