var mongoose = require('mongoose')
var bcrypt = require('bcrypt-nodejs')
var crypto = require('crypto')
var when = require('when')

var userSchema = new mongoose.Schema({
	name: { type: String, required: false, unique: false },
	username: { type: String, required: true, unique: true, lowercase: true },
	email: { type: String, required: true, unique: true, lowercase: true },
	password: String,

	createdAt: { type: Date, default: Date.now },
	
	isAdmin: { type: Boolean, default: false },

	profile: {
		website: {type: String, default: ''},	// minlength/maxlength in mongoose 4+
		bio: {type: String, default: ''},
		avatarOriginal: { type: String, default: '' },
		avatarScaled: { type: String, default: '' },
		headerOriginal: { type: String, default: '' },
		headerScaled: { type: String, default: '' }
	},

	preferences : {
		publishDefaultPublic : {type: Boolean, default: false}
	},

	stats: {
		views: { type: Number, default: 0 },
		projects: { type: Number, default: 0 },
	},

	resetPasswordToken: String,
	resetPasswordExpires: Date
}, {
	toObject: { virtuals: true },
	toJSON: { virtuals: true }
})

userSchema.pre('save', function(next) {
	var user = this

	if(!user.isModified('password'))
		return next()

	bcrypt.genSalt(5, function(err, salt) {
		if (err)
			return next(err)

 		bcrypt.hash(user.password, salt, null, function(err, hash) {
			if (err)
				return next(err)

 			user.password = hash
			next()
		})
	})
})

userSchema.methods.toJSON = function() {
	return {
		id : this._id,
		username: this.username,
		email: this.email,
		createdAt: this.createdAt,
		gravatar: this.gravatar,
		name: this.name,
		profile: {
			website: this.profile.website,
			bio: this.profile.bio,
			avatar: this.profile.avatarScaled,
			header: this.profile.headerScaled
		},
		preferences: {
			publishDefaultPublic: this.preferences.publishDefaultPublic
		},
		stats: {
			views: this.stats.views || 0,
			projects: this.stats.projects || 0
		}
	}
}

userSchema.methods.toPublicJSON = function() {
	var avatar = this.profile.avatarScaled
	if (!avatar)
		avatar = this.gravatar

	return {
		id : this._id,
		username: this.username,
		avatar: avatar,
		header: this.profile.headerScaled,
		name: this.name,
		website: this.profile.website,
		bio: this.profile.bio,
		stats: {
			views: this.stats.views || 0,
			projects: this.stats.projects || 0
		}
	}
}

userSchema.methods.comparePassword = function(candidatePassword, cb) {
	bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
		if (err)
			return cb(err)

 		cb(null, isMatch)
	})
}

userSchema.methods.setStats = function(stats) {
	var dfd = when.defer()

	// update graph views
	this.update({ $set: { stats: stats } }, { w: 1 }, function(err) {
		if (err)
			return dfd.reject(err)

		dfd.resolve() 
	})
	
	return dfd.promise
}

userSchema.methods.increaseViewCount = function() {
	var dfd = when.defer()

	// update view count
	this.update({ $inc: { 'stats.views': 1 } }, { w: 1 }, function(err) {
		if (err)
			return dfd.reject(err)

		dfd.resolve() 
	})
	
	return dfd.promise
}

userSchema.methods.increaseProjectsCount = function() {
	var dfd = when.defer()

	// update projects count
	this.update({ $inc: { 'stats.projects': 1 } }, { w: 1 }, function(err) {
		if (err)
			return dfd.reject(err)

		dfd.resolve() 
	})
	
	return dfd.promise
}

userSchema.methods.decreaseProjectsCount = function() {
	var dfd = when.defer()

	// update projects count
	this.update({ $inc: { 'stats.projects': -1 } }, { w: 1 }, function(err) {
		if (err)
			return dfd.reject(err)

		dfd.resolve() 
	})
	
	return dfd.promise
}

userSchema.virtual('gravatar').get(function(size) {
	if (!size)
		size = 200

 	if (!this.email) {
		return 'https://gravatar.com/avatar/?s=' + size + '&d=retro'
	}

 	var md5 = crypto.createHash('md5').update(this.email).digest('hex')

	return 'https://gravatar.com/avatar/' + md5 + '?s=' + size + '&d=retro'
})

module.exports = mongoose.model('User', userSchema)

