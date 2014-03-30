OscProxy = (function() {
	var _listeners = {};
	var _state = 'disconnected';

	var OscProxy = {};

	OscProxy.connect = function() {
		if (_state === 'connected' || _state === 'connecting')
			return;

		_state = 'connecting';

		var ws = new WebSocket('ws://'+window.location.host+'/__osc-proxy');
		ws.onopen = function()
		{
			console.log('OscProxy connected');
			_state = 'connected';
		};

		ws.onclose = function()
		{
			_state = 'disconnected';
		};

		ws.onmessage = function(evt)
		{
			var oscMessage = JSON.parse(evt.data);
			// console.log('oscMessage', oscMessage);
			if (_listeners[oscMessage.address])
				_listeners[oscMessage.address](oscMessage.args)
		};
	};

	OscProxy.listen = function(address, fn)
	{
		_listeners[address] = fn;
	};

	return OscProxy;

})();
