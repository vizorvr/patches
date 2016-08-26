(function() {

var GLOBAL_CHANNEL_NAME = 'Global'

if (typeof(moment) !== 'undefined' && moment.fn) {
	moment.fn.formatTimeToday = function () {
		var now = moment(Date.now())

		if (this.date() === now.date())
			return this.format("h:mm A")

		return this.calendar()
	}
}

function ChatStore() {
	var that = this
	var lastEditSeen = 0

	E2.app.dispatcher.register(function(pl) {
		if (!that.isForMe(pl))
			return;

		that.emit('added', pl)

		if (pl.from)
			return;

		var message = {
			actionType: 'uiChatMessageAdded',
			channel: GLOBAL_CHANNEL_NAME,
			from: E2.app.channel.uid,
			message: pl.message
		}

		that.wsChannel.send(GLOBAL_CHANNEL_NAME, message)
	})

	function connect() {
		that.wsChannel = E2.app.channel.getWsChannel()

		var joinMessage = {
			kind: 'join',
			lastEditSeen: lastEditSeen,
			channel: GLOBAL_CHANNEL_NAME,
			limit: 80
		}

		that.wsChannel.ws.send(JSON.stringify(joinMessage))

		that.wsChannel.on(GLOBAL_CHANNEL_NAME, function(pl) {
			lastEditSeen = pl.id

			if (pl.from === E2.app.channel.uid)
				return;

			if (pl.kind === 'join')
				that.emit('joined', pl)

			if (pl.kind === 'leave')
				that.emit('left', pl)

			if (!that.isForMe(pl))
				return;

			E2.app.dispatcher.dispatch(pl)
		})
	}

	connect()

	E2.app.channel.on('ready', connect)
}

ChatStore.prototype = Object.create(EventEmitter.prototype)

ChatStore.prototype.isForMe = function(pl) {
	return pl.actionType === 'uiChatMessageAdded' &&
		(!pl.channel || pl.channel === GLOBAL_CHANNEL_NAME)
}

// ------------------------------

function Chat($el, handlebars) {
	this._hbs = handlebars || window.Handlebars
	this.$container = $el;
	this.$messages = $('.messages', this.$container)
	this.$input = $('input', this.$container)

	E2.app.chatStore.on('added',
		this._renderMessage.bind(this))
}

Chat.prototype = Object.create(EventEmitter.prototype)

Chat.prototype.start = function() {
	this.setupInput()
	this.scrollDown()
}

Chat.prototype.setupInput = function() {
	var $i = this.$input

	$i.on('keyup', function(e) {
		if (e.keyCode !== 13)
			return true

		var val = $i.val().trim()
		if (val.length) {
			E2.app.dispatcher.dispatch({
				actionType: 'uiChatMessageAdded',
				date: Date.now(),
				color: E2.app.peopleStore.me ? E2.app.peopleStore.me.color : '#555',
				message: $i.val()
			})

			$i.val('')
		}
	})
}

Chat.prototype._messageCleaner = function(message) {
	return message
		.split(' ')
		.map(function(word) {
			var oword = word

			if (word.indexOf('vizor.io') === -1)
				return word

			word = word.replace(/^https?:\/\//, '')

			var replaced = word.replace(
				/(\S*)vizor\.io(\S*)/,
				'<a target="_blank" '+
					'href="http://$1vizor.io$2">'+
						'$1vizor.io$2</a>')

			return replaced
		})
		.join(' ')
}

Chat.prototype._renderMessage = function(message) {
	var $last = this.$messages.find('.message:last')
	var wasScrolledDown = $last.length ? 
		E2.util.isScrolledIntoView($last) : true

	var messageTemplate = message.meta ? E2.views.chat.meta : E2.views.chat.message
	var renderable = {
		color: message.color,
		from: message.from ? message.username : (
			E2.models.user.get('username') || 
			E2.app.peopleStore.me.username
		),
		date: moment(message.date).formatTimeToday(),
		message: this._messageCleaner(
			$('<span/>').text(message.message).html() // escape 
		)
	}

	var html = messageTemplate(renderable)
	this.$messages.append(html)

	if (wasScrolledDown)
		this.scrollDown()
}

Chat.prototype.scrollDown = function() {
	this.$messages.scrollTop(
		$('.messages')[0].scrollHeight + 100
	)
}

if (typeof(exports) !== 'undefined') {
	exports.ChatStore = ChatStore
	exports.Chat = Chat
} else {
	E2.Chat = Chat
	E2.ChatStore = ChatStore
}

})();
