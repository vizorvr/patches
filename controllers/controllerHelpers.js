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