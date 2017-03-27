module.exports = {
	server: {
		debug: true,
		enableChannels: true,
		enableOSC: true,
		oscPort: 8001,
		enableFrameDumping: true,
		useCDN: process.env.NODE_ENV === 'production',
		cdnRoot: 'https://cdn.vizor.io',
		engiPath: './browser/',
		host: '127.0.0.1',
		port: 8000
	}
}
