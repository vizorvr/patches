(function() {

function Store() {
	EventEmitter.call(this)
}

Store.prototype = Object.create(EventEmitter.prototype)

if (typeof(module) !== 'undefined')
	module.exports = Store
else
	window.Store = Store

})();
