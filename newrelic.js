/**
 * New Relic agent configuration.
 *
 * See lib/config.defaults.js in the agent distribution for a more complete
 * description of configuration variables and their potential values.
 */
exports.config = {
	app_name: ['create.vizor.io'],
	license_key: process.env.NEWRELIC,
	logging: {
		level: 'info'
	}
};
