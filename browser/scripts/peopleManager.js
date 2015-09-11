
function PeopleManager(peopleStore, $el) {
	var that = this

	this.peopleStore = peopleStore
	this.$el = $el
	this._template = E2.views.partials.peopleMenu

	this.peopleStore.on('added', this.render.bind(this))
	this.peopleStore.on('removed', this.render.bind(this))
	this.peopleStore.on('userUnfollowed', function(person, followee) {
		if (followee.uid === E2.app.channel.uid)
			E2.app.growl(person.username+' stopped following you', 'unfollowed')

		that.render()
	})
	this.peopleStore.on('userFollowed', function(person, followee) {
		if (followee.uid === E2.app.channel.uid)
			E2.app.growl(person.username+' started following you', 'followed')

		that.render()
	})
}

PeopleManager.prototype.render = function() {
	var that = this

	var people = this.peopleStore.list().map(function(p) {
		p.followed = (p.uid === that.peopleStore.me.followUid)

		if (p.uid === E2.app.channel.uid)
			p.itsMe = true

		return p
	})

	var html = this._template({ people: people })

	this.$el.empty().html(html)

	this.$el.find('li').click(function(e) {
		var $t = $(e.target).closest('li')
		var uid = $t.data('uid')

		if (that.peopleStore.me.followUid === uid) {
			E2.app.dispatcher.dispatch({
				actionType: 'uiUserIdUnfollowed',
				followUid: uid
			})
		} else {
			if (uid === E2.app.channel.uid)
				return;

			E2.app.dispatcher.dispatch({
				actionType: 'uiUserIdFollowed',
				followUid: uid
			})
		}
	})
}


