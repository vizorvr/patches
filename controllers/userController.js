var _ = require('lodash')
var async = require('async')
var crypto = require('crypto')
var passport = require('passport')
var User = require('../models/user')
var mailer = require('../lib/mailer')
var helper = require('./controllerHelpers')

/**
 * GET /login
 * Login page.
 */

 exports.getLogin = function(req, res) {
 	if (req.user)
 		return res.redirect('/')

 	res.render('server/pages/account/login', {
 		meta: {
			bodyclass: 'bLogin',
			title: 'Login',
			scripts: [
				helper.metaScript('site/accountpages.js')
			]
		}
 	})
 }

/**
 * POST /login
 * Sign in using email and password.
 * @param email
 * @param password
 */

 exports.postLogin = function(req, res, next) {
 	req.assert('email', 'Email is not valid').isEmail()
 	req.assert('password', 'Password cannot be blank').notEmpty()

 	var wantJson = req.xhr || req.path.slice(-5) === '.json'

 	function returnErrors(errors, status, reason) {
 		if (wantJson)
	 		return res.status(status || 400).json(helper.responseStatusError(reason, errors))

 		req.flash('errors', helper.parseErrors(errors))
 		return res.redirect('/login')
 	}

	var errors = req.validationErrors()
 	if (errors)
 		return returnErrors(errors, 400, 'Validation failed')

 	passport.authenticate('local', function(err, user, info) {
 		if (err)
 			return returnErrors([{ message: err.toString() }], 500, 'Server error')

 		if (!user) {
 			if (info)
	 			return returnErrors([ info ], 401, 'Failed authentication')
 		}

 		req.logIn(user, function(err) {
 			if (err)
	 			return returnErrors([{ message: err.toString() }], null, 'could not login')

			var message = 'Success! You are logged in.'
 			if (wantJson)
 				res.json(helper.responseStatusSuccess(message, user.toJSON(), {
					redirect: req.session.returnTo || '/account'
				}))
 			else {
				req.flash('success', { message: message})
 				res.redirect(req.session.returnTo || '/account')
			}
 		})
 	})(req, res, next)
 }

/**
 * GET /logout
 */
 exports.logout = function(req, res) {
 	req.logout()
 	res.redirect('/')
 }

/**
 * GET /signup
 */
 exports.getSignup = function(req, res) {
	var wantJSON = req.xhr
	if (wantJSON) {
		if (req.user) {
			return res.status(403).json(helper.responseStatusError('user already logged in')).end()
		}

		return res.status(501).json(helper.responseStatusError('not yet implemented')).end()

	} else {
		if (req.user) {
			return res.redirect('/')
		}
		res.render('server/pages/account/signup', {
			meta : {
				title: 'Sign up to Vizor',
				scripts: [
					helper.metaScript('site/accountpages.js')
				]
			}
		})
	}
 }

/**
 * GET /account/exists
 **/
 exports.checkUserName = function(req, res, next) {
 	User.findOne({ username: req.body.username },	
 		function(err, existingUser) {
 			if (err)
 				return next(err)

 			if (!existingUser) {
 				return res.json(
 					helper.responseStatusSuccess('Username is available',
 						{username: req.body.username})
 				)
 			}

 			var msg = 'Username taken'
 			var error = helper.formatResponseError('username', req.body.username, msg)
 			return res.status(409)
 				.json(helper.responseStatusError(msg,error))
 				.end()
 		}
 	)
 }

/**
 * GET /account/email/exists
 **/
 exports.checkEmailExists = function(req, res, next) {
 	console.log('checkEmailExists', req.body.email)
 	User.findOne({ email: req.body.email },
 		function(err, existingUser) {
 			if (err)
 				return next(err)

 			if (!existingUser) {
 				return res.json(
 					helper.responseStatusSuccess('Email is available',
 						{email: req.body.email})
 				)
 			}

 			var msg = 'Email taken'
 			var error = helper.formatResponseError('email', req.body.email, msg)
 			return res.status(409)
	 			.json(helper.responseStatusError(msg, error))
 				.end()
 		}
 	)
 }

/**
 * POST /signup
 * Create a new local account.
 * @param email
 * @param password
 */

 exports.postSignup = function(req, res, next) {
	req.sanitize('name').trim()
	req.sanitize('username').trim()
	req.sanitize('email').trim()
 	req.assert('name', 'Please enter a name').notEmpty()
 	req.assert('username', 'Username is empty or invalid').isAlphanumeric()
 	req.assert('email', 'Email is not valid').isEmail()
 	req.assert('password', 'Password must be at least 8 characters long').len(8)

	var wantJSON = req.xhr;
 	var errors = req.validationErrors()

 	if (errors) {
		var lastreq = req.body;
		delete(lastreq.password);
		if (wantJSON)
 			return res.status(400).json(helper.responseStatusError('Failed validation', errors, {request:lastreq}))

		req.flash('errors', helper.parseErrors(errors));
		return res.redirect('/signup');
 	}

 	var user = new User({
 		name: req.body.name.replace(/[<>\\\\'\"]+/gim, ''),
 		username: req.body.username,
 		email: req.body.email,
 		password: req.body.password
 	})

 	User.findOne({ username: req.body.username }, function(err, existingUser) {	// #664
 		if (existingUser) {
 			if (req.xhr){
				var msg = 'An account with that username already exists.'
				var error = helper.formatResponseError('username', req.body.username, msg)
 				return res.status(400).json(helper.responseStatusError(msg, error))
 			}
 			return res.redirect('/signup')
 		}
 		User.findOne({ email: req.body.email }, function(err, existingUser) {	// #664
 			if (existingUser) {
 				if (req.xhr) {
					var msg = 'An account with that email already exists.'
					var error = helper.formatResponseError('email', req.body.email, msg)
 					return res.status(400).json(helper.responseStatusError(msg, error))
 				}
 				return res.redirect('/signup')
 			}

 			user.save(function(err) {
 				if (err) return next(err)
 				req.logIn(user, function(err) {
 					if (err) return next(err)
 					if (req.xhr) {
						res.status(200).json(helper.responseStatusSuccess('New account created', user.toJSON(), {
							redirect: req.session.returnTo || '/account'
						}))
 					} else {
 						res.redirect(req.session.returnTo || '/account')
 					}
 				})
 			})
 		})
 	})
 }

/**
 * GET /account
 * redirect to /account/profile
 */
exports.getAccount = function(req, res) {
	res.redirect('/account/profile');
}


/**
 * GET /account/profile
 * Profile page.
 */
 exports.getAccountProfile = function(req, res) {
	var wantJSON = req.xhr
	User.findById(req.user.id, function(err, user) {
		if (err) return next(err)
		if (wantJSON) {
			return res.status(200).json(helper.responseStatusSuccess('OK', user.toJSON()))
		}
		else {
			var data = {
				meta: {
					title: 'Account Management',
					bodyclass: 'bProfile',
					header: 'srv/userpage/userpageHeader',
					footer: 'srv/home/_footer',
					scripts: [
						helper.metaScript('site/accountpages.js')
					]
				},
				profile: user.toJSON()
			}
			res.render('server/pages/account/profile', data)
		}
	})
 }

/**
 * POST /account/profile
 * Update profile information.
 */
 exports.postUpdateProfile = function(req, res, next) {

	 // to add a key
	 // 1.sanitize
	 // 2. check for key in req.body
	 // 	3. req.assert validation by key
	 // 	4. add req.body.key to updateFields.key
	 // 5. add key to copyKeysIfExist
	 
	var mustConfirmPassword = false

	req.sanitize('name').trim()
	req.sanitize('email').trim()
	req.sanitize('profile[website]').trim()
	req.sanitize('profile[bio]').trim()

	var updateFields = {
		profile: {},
		preferences: {}
	}

	if ('email' in req.body) {
		mustConfirmPassword = true
		req.assert('email', 'Email is not valid').isEmail()
		updateFields.email = req.body.email
	}

	if('password' in req.body) {
		mustConfirmPassword = true
		req.assert('password', 'New password is not valid').isLength({min: 6})
		updateFields.password = req.body.password
	}

	if ('name' in req.body) {
		req.assert('name', 'Name is not valid').notEmpty()
		updateFields.name = req.body.name.replace(/[<>\\\\'\"]+/gim, '')
	}

	if (req.body.profile) {
		if ('website' in req.body.profile) {
			// allow '' or valid URL only
			if (req.body.profile.website !== '')
				req.assert('profile[website]', 'Website is not valid').isURL({require_protocol:true})
			updateFields.profile.website = req.body.profile.website
		}

		if ('bio' in req.body.profile) {
			req.assert('profile[bio]', 'Bio must be shorter than 200 characters').isLength({min: 0, max: 200})
			updateFields.profile.bio = req.body.profile.bio
		}
	}

	 if (req.body.preferences) {
		 if ('publishDefaultPublic' in req.body.preferences)
			 updateFields.preferences.publishDefaultPublic = (req.body.preferences.publishDefaultPublic === '1')
	 }

	if (mustConfirmPassword)
		req.assert('current_password', 'Your current password is required').notEmpty()

 	var errors = req.validationErrors()

 	if (errors) {
		delete req.body.password
		delete req.body.current_password
		return helper.respond(req, res, 400, 'Failed validation', errors, null, '/account/profile')
 	}

	 function updateUser(user, updateFields) {
		function copyKeysIfExist(keys, fromObj, toObj) {
			keys.forEach(function(key){
				if (key in fromObj)
					toObj[key] = fromObj[key]
			})
		}
		copyKeysIfExist(['email', 'password', 'name'], updateFields , user)
		copyKeysIfExist(['website', 'bio'] , updateFields.profile, user.profile)
		copyKeysIfExist(['publishDefaultPublic'] , updateFields.preferences, user.preferences)

		function save() {
			user.save(function(err) {
				if (err)
					return next(err)
				return helper.respond(req, res, 200, 'Account details updated', user.toJSON(), null, '/account/profile')
			})
		}

		// if updating email, then check that email does not exist already
		if ('email' in updateFields) {
			User.findOne({email: updateFields.email}, function(err, existingUser){
				if (!existingUser) {
					save()
					return
				}
				// else
				var error = helper.formatResponseError('email', req.body.email, 'Another account with that email already exists')

				return helper.respond(req, res, 409, 'Duplicate email', error, null, '/account/profile')
			})
		} else
			save()
	 }

 	User.findById(req.user.id, function(err, user) {
 		if (err) return next(err)

		if (mustConfirmPassword)
		 	user.comparePassword(req.body.current_password, function(err, isMatch) {
				if (isMatch)
					updateUser(user, updateFields)
				else {
					return helper.respond(req, res, 401, 'Unauthorised',
						helper.formatResponseError('current_password', '', 'Current password does not match'),
						null, '/account/profile')
				}
			})
		else
			updateUser(user, updateFields)
 	})
 }

/**
 * POST /account/password
 * Update current password. Used on resetting password from email link
 * @param password
 * @see this.postUpdateProfile() for updating the password from the profile page
 */

 exports.postUpdatePassword = function(req, res, next) {
 	req.assert('password', 'Password must be at least 8 characters long').len(8)
 	req.assert('confirm', 'Passwords must match').equals(req.body.password)
	var wantJSON = req.xhr

 	var errors = req.validationErrors()

 	if (errors) {
		if (!wantJSON) {
			req.flash('errors', helper.parseErrors(errors))
			return res.redirect('/account/profile')
		} else {
			return res.status(400).json(
				helper.responseStatusError('Failed validation', errors)	// request intentionally not returned
			)
		}
 	}

 	User.findById(req.user.id, function(err, user) {
 		if (err) return next(err)

 		user.password = req.body.password

 		user.save(function(err) {
 			if (err) return next(err)
			if (wantJSON) {
				return res.json(
					helper.responseStatusSuccess('Password has been changed.', user.toJSON())
				)
			} else {
				req.flash('success', { message: 'Password has been changed.' })
				res.redirect('/account/profile')
			}
 		})
 	})
 }

/**
 * POST /account/delete
 * Delete user account.
 */

 exports.postDeleteAccount = function(req, res, next) {
 	User.remove({ _id: req.user.id }, function(err) {
 		if (err) return next(err)
 		req.logout()
 		req.flash('info', { message: 'Your account has been deleted.' })
 		res.redirect('/')
 	})
 }

/**
 * GET /account/unlink/:provider
 * Unlink OAuth2 provider from the current user.
 * @param provider
 * @param id - User ObjectId
 */

 exports.getOauthUnlink = function(req, res, next) {
 	var provider = req.params.provider
 	User.findById(req.user.id, function(err, user) {
 		if (err) return next(err)

 		user[provider] = undefined
 		user.tokens = _.reject(user.tokens, function(token) { return token.kind === provider })

 		user.save(function(err) {
 			if (err) return next(err)
 			req.flash('info', { message: provider + ' account has been unlinked.' })
 			res.redirect('/account/profile')
 		})
 	})
 }

/**
 * GET /reset/:token
 * Reset Password page.
 */

 exports.getReset = function(req, res) {
 	if (req.isAuthenticated()) {
 		return res.redirect('/')
 	}

 	User
 	.findOne({ resetPasswordToken: req.params.token })
 	.where('resetPasswordExpires').gt(Date.now())
 	.exec(function(err, user) {
 		if (!user) {
 			req.flash('errors', { message: 'Password reset token is invalid or has expired.' })
 			return res.redirect('/forgot')
 		}
 		res.render('server/pages/account/setPassword', {
			meta: {
				bodyclass: 'bLogin'
			},
 			title: 'Password Reset',
 			token: req.params.token
 		})
 	})
 }

/**
 * POST /reset/:token
 * Process the reset password request.
 */

 exports.postReset = function(req, res, next) {
 	req.assert('password', 'Password must be at least 8 characters long').len(8)
 	req.assert('confirm', 'Passwords must match.').equals(req.body.password)

 	var errors = req.validationErrors()

 	if (errors) {
 		req.flash('errors', helper.parseErrors(errors))
 		return res.redirect('back')
 	}

 	async.waterfall([
 		function(done) {
 			User
 			.findOne({ resetPasswordToken: req.params.token })
 			.where('resetPasswordExpires').gt(Date.now())
 			.exec(function(err, user) {
 				if (!user) {
 					req.flash('errors', { message: 'Password reset token is invalid or has expired.' })
 					return res.redirect('back')
 				}

 				user.password = req.body.password
 				user.resetPasswordToken = undefined
 				user.resetPasswordExpires = undefined

 				user.save(function(err) {
 					if (err) return next(err)
 					req.logIn(user, function(err) {
 						done(err, user)
 					})
 				})
 			})
 		},
 		function(user, done) {
 			var mail = {
 				to: user.email,
 				from: 'info@vizor.io',
 				subject: 'Your Vizor password has been changed',
 				html: 'Hello,<br><br>' +
	 				'This is a confirmation that the password for your account ' + user.email + ' has just been changed.<br><br>',
 				text: 'Hello,\n\n' +
	 				'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n',
 			}

 			mailer.send(mail.to, mail.subject, mail.html, mail.text)
 			.then(function() {
 				req.flash('success', { message: 'Success! Your password has been changed.' })
 				done()
 			})
 			.catch(done)
 		}
 		], function(err) {
 			if (err) return next(err)
 			res.redirect('/')
 		})
}

/**
 * GET /forgot
 * Forgot Password page.
 */

 exports.getForgot = function(req, res) {
 	if (req.isAuthenticated()) {
 		return res.redirect('/account')
 	}
 	res.render('server/pages/account/forgotPassword', {
		meta: {
			title: 'Forgot Password',
			bodyclass: 'bAccount'
		}
 	})
 }

/**
 * POST /forgot
 * Create a random token, then the send user an email with a reset link.
 * @param email
 */

 exports.postForgot = function(req, res, next) {
	req.sanitize('email').trim()
 	req.assert('email', 'Please enter a valid email address.').isEmail()
	var wantJSON = req.xhr

 	var errors = req.validationErrors()

 	if (errors) {
		if (wantJSON) {
			return res.status(400).json(
				helper.responseStatusError('Failed validation', errors, {request:req.body})
			)
		} else {
			req.flash('errors', helper.parseErrors(errors))
			return res.redirect('/forgot')
		}
 	}

	var email = req.body.email
 	async.waterfall([
 		function(done) {
 			crypto.randomBytes(16, function(err, buf) {
 				var token = buf.toString('hex')
 				done(err, token)
 			})
 		},
 		function(token, done) {
 			User.findOne({ email: req.body.email }, function(err, user) { // #664
 				if (!user) {
					var msg = 'No account with that email address exists.'
					if (wantJSON) {
						return res.status(400).json(
							helper.responseStatusError(msg, helper.formatResponseError('email', email, msg), {request: req.body})
						)
					} else {
						req.flash('errors', { message: msg })
						return res.redirect('/forgot')
					}
 				}

 				user.resetPasswordToken = token
				user.resetPasswordExpires = Date.now() + 3600000 // 1 hour

				user.save(function(err) {
					done(err, token, user)
				})
			})
 		},
 		function(token, user, done) {
 			var mail = {
 				to: user.email,
 				from: 'info@vizor.io',
 				subject: 'Reset your password on Vizor',
 				html: 'You are receiving this email because you (or someone else) have requested the reset of the password for your account.<br/><br/>' +
 				'Please click on the following link, or paste this into your browser to complete the process:<br/><br/>' +
 				'http://' + req.headers.host + '/reset/' + token + '<br/><br/>' +
 				'If you did not request this, please ignore this email and your password will remain unchanged.<br/><br/>',
 				text: 'You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n' +
 				'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
 				'http://' + req.headers.host + '/reset/' + token + '\n\n' +
 				'If you did not request this, please ignore this email and your password will remain unchanged.\n'
 			}

 			mailer.send(mail.to, mail.subject, mail.html, mail.text)
 			.then(function() {
				if (!wantJSON) {
					req.flash('info', {
						message: 'We emailed further instructions to ' + user.email + '.'
					})
				}
 				done()
 			})
 			.catch(done)
 		}
 		], function(err) {
 			if (err) {
				res.status(500).json(
					helper.responseStatusError('The server could not email you. Please contact us for assistance.', [], {diag: err})
				)
 				return next(err)
			}
			if (wantJSON) {
				return res.status(200).json(
					helper.responseStatusSuccess('We emailed further instructions to ' + email + '.', {email: email})
				)
			} else {
				res.redirect('/forgot')
			}

 		})
}
