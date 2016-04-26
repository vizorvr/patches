var SparkPost = require('sparkpost')
var when = require('when')

exports.send = function send(to, subject, html, text) {
	var dfd = when.defer()

	console.log('mailer: sending to', to, subject, text)

	if (!process.env.KEY_SPARKPOST)
		return when.resolve()

	var client = new SparkPost(process.env.KEY_SPARKPOST)

	client.transmissions.send({
		transmissionBody: {
			content: {
				from: 'info@vizor.io',
				subject: subject,
				html: html,
				text: text
			},
			recipients: [
				{ address: to }
			]
		}
	}, function(err, res) {
		if (err) {
			console.error(err)
			dfd.reject(err)
		} else {
			dfd.resolve()
		}
	})

	return dfd.promise
}

