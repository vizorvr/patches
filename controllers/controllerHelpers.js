var _ = require('lodash')

exports.responseStatusSuccess = function responseStatusSuccess(message, data, options) {
    return _.extend(options || {}, {
    	success: true,
    	message: message,
    	data: data || {}
    })
}

exports.responseStatusError = function responseStatusError(message, errors, options) {
	errors = errors || []

	if (!(errors instanceof Array))
		errors = [errors]

    return _.extend(options || {}, {
    	success: false,
    	message: message,
    	errors: errors || []
    })
}

// genericXHRform <3 expressValidator.defaults.errorFormatter
exports.formatResponseError = function formatResponseError(param, value, msg) {
	return {
		param: param,
		msg: msg,
		value: value
	}
}

exports.parseErrors = function parseErrors(errors) {
	var parsedErrors = []

	if (!(errors instanceof Array))
		errors = [errors]

	for(var i=0; i < errors.length; i++) {
		parsedErrors.push({ message: errors[i].msg })
	}

	return parsedErrors
}

exports.metaScript = function(path) {
	var parts = path.split('/')
	return [process.startTime]
		.concat(parts[0])
		.concat(parts.splice(1))
		.join('/')
}

exports.respond = function respond(req, res, status, message, bodyOrErrors, responseOptions, redirectIfNotXHR) {
	var response
	var isOk = (status === 200)

	var isXHR = req.xhr || req.path.slice(-5) === '.json'

	if (isOk)
		response = exports.responseStatusSuccess(message, bodyOrErrors, responseOptions)
	else
		response = exports.responseStatusError(message, bodyOrErrors, responseOptions)

	if (isXHR)
		return res.status(status).json(response)
	else {
		if (isOk)
			req.flash('success', {message: message})
		else
			req.flash('errors', exports.parseErrors(bodyOrErrors))

		if (redirectIfNotXHR)
			return res.redirect(redirectIfNotXHR)

		console.error('controllerHelper.respond but no xhr and no redirectIfNotXHR')
	}
}
