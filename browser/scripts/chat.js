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

	this.wsChannel = E2.app.channel.getWsChannel()

	var joinMessage = {
		kind: 'join',
		channel: GLOBAL_CHANNEL_NAME,
		limit: 80
	}

	this.wsChannel.ws.send(JSON.stringify(joinMessage))

	this.wsChannel.on(GLOBAL_CHANNEL_NAME, function(pl) {
		if (pl.kind === 'join')
			that.emit('joined', pl)

		if (pl.kind === 'leave')
			that.emit('left', pl)

		if (!that.isForMe(pl))
			return;

		E2.app.dispatcher.dispatch(pl)
	})

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
}

ChatStore.prototype = Object.create(EventEmitter.prototype)

ChatStore.prototype.isForMe = function(pl) {
	return pl.actionType === 'uiChatMessageAdded' &&
		(!pl.channel || pl.channel === GLOBAL_CHANNEL_NAME)
}

// ------------------------------

function Chat($el, handlebars) {
	var that = this

	this._hbs = handlebars || window.Handlebars
	this.$messages = $el.find('.messages')
	this.$input = $el.find('input')

	E2.app.chatStore.on('added',
		this._renderMessage.bind(this))

	E2.app.chatStore.on('joined', function(message) {
		message.meta = true
		message.message = 'joined the chat'
		that._renderMessage(message)
	})

	E2.app.chatStore.on('left', function(message) {
		message.meta = true
		message.message = 'left the chat'
		that._renderMessage(message)
	})

	this.setupInput()
	this.scrollDown()
}

Chat.prototype = Object.create(EventEmitter.prototype)

Chat.prototype.setupInput = function() {
	var $i = this.$input

	$i.on('keyup', function(e) {
		var val = $i.val()

		if (e.keyCode === 13 && val.length) {
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

Chat.prototype._renderMessage = function(message) {
	var $last = $('.chat .message:last')
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
		message: $('<span/>').text(message.message).html() // escape 
			.replace(/[htps:\/]?vizor\.io[\/]?(\S*)/,
				'<a target="_blank" href="//vizor.io/$1">vizor.io/$1</a>')
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

})()
