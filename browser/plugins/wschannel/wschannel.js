WsChannel = (function() {
	if (typeof(WsChannel) !== 'undefined')
		return WsChannel;

	var _listeners = {};
	var _state = 'disconnected';
	var ws;

	function connect() {
		if (_state === 'connected' || _state === 'connecting')
			return;

		_state = 'connecting';

		ws = new WebSocket('ws://'+window.location.hostname+':'+(window.location.port || 80)+'/__wschannel');
		ws.onopen = function()
		{
			console.log('WsChannel connected');
			_state = 'connected';
		};

		ws.onclose = function()
		{
			console.warn('WsChannel disconnected!');
			_state = 'disconnected';
		};

		ws.onmessage = function(evt)
		{
			var m = JSON.parse(evt.data);
			console.log('IN:', m);

			if (_listeners[m.channel])
				_listeners[m.channel](m);

			if (_listeners['*'])
				_listeners['*'](m);
		};
	};

	connect();

	return {
		join: function(channel)
		{
			ws.send(JSON.stringify({ kind: 'join', channel: channel }))
		},
		send: function(channel, data)
		{
			if (_state !== 'connected')
				return;

			if (typeof(data) !== 'object')
			{
				data = { kind: data };
				data.channel = channel;
			}

			ws.send(JSON.stringify(data));
		},
		on: function(channel, fn)
		{
			_listeners[channel] = fn;
		},
		off: function(channel)
		{
			delete _listeners[channel];
		}
	};

})();
