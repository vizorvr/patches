module.exports = {
	db: process.env.MONGODB || 'mongodb://localhost:27017/vizor',
	gridFs: process.env.GRIDFS || 'mongodb://localhost:27017/vizor-assets',
	sessionSecret: process.env.SESSION_SECRET || 'vizor',
	mandrill: process.env.MANDRILL || 'mandrillSecretNotThere',
};
