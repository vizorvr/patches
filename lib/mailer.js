var secrets = require('../config/secrets')
var mandrill = require('node-mandrill')(secrets.mandrill)
var when = require('when')

exports.send = function send(to, subject, text) {
	var dfd = when.defer()

	console.log('mailer: sending to', to, subject, text)

	mandrill('/messages/send', {
			message: {
				to: to,
				from_email: 'info@vizor.io',
				subject: subject,
				text: text
			}
		},
		function(error, response) {
			console.log('mailer: sent to', to, error, response)

			if (error)
				return dfd.reject(error);

			dfd.resolve(response)
		})

	return dfd.promise;
}
