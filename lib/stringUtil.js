exports.isStringEmpty = function isStringEmpty(str) {
	return (str.length === 0 || !str.trim());
}

exports.makeRandomString = function makeRandomString(len) {
	var keys = 'abcdefghjkmnpqrstuvwxyz23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
	var str = ''
	for (var i=0; i < len; i++) {
		str += keys[Math.floor(Math.random() * keys.length)]
	}
	return str
}
