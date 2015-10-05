var _ = require('lodash');
var async = require('async');
var crypto = require('crypto');
var passport = require('passport');
var User = require('../models/user');
var secrets = require('../config/secrets');
var mailer = require('../lib/mailer');

function parseErrors(errors) {
  var parsedErrors = [];
  for( var i=0; i < errors.length; i++ ) {
    parsedErrors.push({ message: errors[i].msg });
  }
  return parsedErrors;
}

/**
 * GET /login
 * Login page.
 */

 exports.getLogin = function(req, res) {
 	if (req.user)
 		return res.redirect('/');
 	res.render('account/login', {
 		title: 'Login'
 	});
 };

/**
 * POST /login
 * Sign in using email and password.
 * @param email
 * @param password
 */

 exports.postLogin = function(req, res, next) {
 	req.assert('email', 'Email is not valid').isEmail();
 	req.assert('password', 'Password cannot be blank').notEmpty();

 	var errors = req.validationErrors();
 	var wantJson = req.xhr || req.path.slice(-5) === '.json'

 	if (errors) {
    req.flash('errors', parseErrors(errors));
 		return res.redirect('/login');
 	}

 	passport.authenticate('local', function(err, user, info) {
 		if (err)
 			return next(err);
 		if (!user) {
 			if (wantJson)
 				return res.status(401).send();
 			req.flash('errors', { message: info.message });
 			return res.redirect('/login');
 		}
 		req.logIn(user, function(err) {
 			if (err) return next(err);
 			req.flash('success', { message: 'Success! You are logged in.' });
 			if (wantJson)
 			{
 				res.json(user.toJSON());
 			}
 			else
 			{
 				res.redirect(req.session.returnTo || '/account');
 			}
 		});
 	})(req, res, next);
 };

/**
 * GET /logout
 */
 exports.logout = function(req, res) {
 	req.logout();
 	res.redirect('/login');
 };

/**
 * GET /signup
 */
 exports.getSignup = function(req, res) {
 	if (req.user) return res.redirect('/');
 	res.render('account/signup', {
 		title: 'Create Account'
 	});
 };

/**
 * GET /account/exists
 **/
exports.checkUserName = function(req, res, next) {
  User.findOne({ username: req.body.username },
    function(err, existingUser) {
      if (err)
        return next(err)

      if (!existingUser)
        return res.json({ ok: true })

      return res.status(409).end()
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
 	req.assert('username', 'Username is not valid').isAlphanumeric();
 	req.assert('email', 'Email is not valid').isEmail();
 	req.assert('password', 'Password must be at least 4 characters long').len(4);

 	var errors = req.validationErrors();

 	if (errors) {
 		return res.status(400).json(errors);
 	}

 	var user = new User({
		name: req.body.name.replace(/[<>\;\\\'\"]+/gim, ''),
 		username: req.body.username,
 		email: req.body.email,
 		password: req.body.password
 	});

 	User.findOne({ username: req.body.username }, function(err, existingUser) {
 		if (existingUser) {
 			if (req.xhr){
 				return res.status(400).json({
          message: 'Account with that username already exists.'
        });
 			}
 			return res.redirect('/signup');
 		}
 		User.findOne({ email: req.body.email }, function(err, existingUser) {
 			if (existingUser) {
 				if (req.xhr) {
 					return res.status(400).json({ message: 'Account with that email already exists.' });
 				}
 				return res.redirect('/signup');
 			}

 			user.save(function(err) {
 				if (err) return next(err);
 				req.logIn(user, function(err) {
 					if (err) return next(err);
 					if (req.xhr) {
 						res.json(user.toJSON());
 					} else {
 						res.redirect(req.session.returnTo || '/account');
 					}
 				});
 			});
 		});
 	});
 };

/**
 * GET /account
 * Profile page.
 */

 exports.getAccount = function(req, res) {
 	res.render('account/profile', {
 		title: 'Account Management'
 	});
 };

/**
 * POST /account/profile
 * Update profile information.
 */

 exports.postUpdateProfile = function(req, res, next) {
  req.assert('email', 'Email is not valid').isEmail();
  
  var errors = req.validationErrors();

  if (errors) {
    return res.status(400).json(errors);
  }

	User.findById(req.user.id, function(err, user) {
 		if (err) return next(err);

    user.name = req.body.name.replace(/[<>\;\\\'\"]+/gim, '');
 		user.email = req.body.email

 		user.save(function(err) {
 			if (err)
        return next(err);

 			res.json({})
 		});
 	});
 };

/**
 * POST /account/password
 * Update current password.
 * @param password
 */

 exports.postUpdatePassword = function(req, res, next) {

 	req.assert('password', 'Password must be at least 4 characters long').len(4);

 	var errors = req.validationErrors();

 	if (errors) {
    req.flash('errors', parseErrors(errors));
    console.log(parsedErrors);
 		return res.redirect('/account');
 	}

 	User.findById(req.user.id, function(err, user) {
 		if (err) return next(err);

 		user.password = req.body.password;

 		user.save(function(err) {
 			if (err) return next(err);
 			req.flash('success', { message: 'Password has been changed.' });
 			res.redirect('/account');
 		});
 	});
 };

/**
 * POST /account/delete
 * Delete user account.
 */

 exports.postDeleteAccount = function(req, res, next) {
 	User.remove({ _id: req.user.id }, function(err) {
 		if (err) return next(err);
 		req.logout();
 		req.flash('info', { message: 'Your account has been deleted.' });
 		res.redirect('/');
 	});
 };

/**
 * GET /account/unlink/:provider
 * Unlink OAuth2 provider from the current user.
 * @param provider
 * @param id - User ObjectId
 */

 exports.getOauthUnlink = function(req, res, next) {
 	var provider = req.params.provider;
 	User.findById(req.user.id, function(err, user) {
 		if (err) return next(err);

 		user[provider] = undefined;
 		user.tokens = _.reject(user.tokens, function(token) { return token.kind === provider; });

 		user.save(function(err) {
 			if (err) return next(err);
 			req.flash('info', { message: provider + ' account has been unlinked.' });
 			res.redirect('/account');
 		});
 	});
 };

/**
 * GET /reset/:token
 * Reset Password page.
 */

 exports.getReset = function(req, res) {
 	if (req.isAuthenticated()) {
 		return res.redirect('/');
 	}

 	User
 	.findOne({ resetPasswordToken: req.params.token })
 	.where('resetPasswordExpires').gt(Date.now())
 	.exec(function(err, user) {
 		if (!user) {
 			req.flash('errors', { message: 'Password reset token is invalid or has expired.' });
 			return res.redirect('/forgot');
 		}
 		res.render('account/reset', {
 			title: 'Password Reset',
 			token: req.params.token
 		});
 	});
 };

/**
 * POST /reset/:token
 * Process the reset password request.
 */

 exports.postReset = function(req, res, next) {
 	req.assert('password', 'Password must be at least 4 characters long.').len(4);
 	req.assert('confirm', 'Passwords must match.').equals(req.body.password);

 	var errors = req.validationErrors();

 	if (errors) {
    req.flash('errors', parseErrors(errors));
 		return res.redirect('back');
 	}

 	async.waterfall([
 		function(done) {
 			User
 			.findOne({ resetPasswordToken: req.params.token })
 			.where('resetPasswordExpires').gt(Date.now())
 			.exec(function(err, user) {
 				if (!user) {
 					req.flash('errors', { message: 'Password reset token is invalid or has expired.' });
 					return res.redirect('back');
 				}

 				user.password = req.body.password;
 				user.resetPasswordToken = undefined;
 				user.resetPasswordExpires = undefined;

 				user.save(function(err) {
 					if (err) return next(err);
 					req.logIn(user, function(err) {
 						done(err, user);
 					});
 				});
 			});
 		},
 		function(user, done) {
 			var mail = {
 				to: [ { email: user.email } ],
 				from: 'info@vizor.io',
 				subject: 'Your Vizor password has been changed',
 				text: 'Hello,\n\n' +
 				'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
 			}

 			mailer.send(mail.to, mail.subject, mail.text)
 			.then(function() {
 				req.flash('success', { message: 'Success! Your password has been changed.' })
 				done()
 			})
 			.catch(done)
 		}
 		], function(err) {
 			if (err) return next(err);
 			res.redirect('/');
 		});
};

/**
 * GET /forgot
 * Forgot Password page.
 */

 exports.getForgot = function(req, res) {
 	if (req.isAuthenticated()) {
 		return res.redirect('/account');
 	}
 	res.render('account/forgot', {
 		title: 'Forgot Password'
 	});
 };

/**
 * POST /forgot
 * Create a random token, then the send user an email with a reset link.
 * @param email
 */

 exports.postForgot = function(req, res, next) {
 	req.assert('email', 'Please enter a valid email address.').isEmail();

 	var errors = req.validationErrors();

 	if (errors) {
    req.flash('errors', parseErrors(errors));
 		return res.redirect('/forgot');
 	}

 	async.waterfall([
 		function(done) {
 			crypto.randomBytes(16, function(err, buf) {
 				var token = buf.toString('hex');
 				done(err, token);
 			});
 		},
 		function(token, done) {
 			User.findOne({ email: req.body.email.toLowerCase() }, function(err, user) {
 				if (!user) {
 					req.flash('errors', { message: 'No account with that email address exists.' });
 					return res.redirect('/forgot');
 				}

 				user.resetPasswordToken = token;
				user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

				user.save(function(err) {
					done(err, token, user);
				});
			});
 		},
 		function(token, user, done) {
 			var mail = {
 				to: [ { email: user.email } ],
 				from: 'info@vizor.io',
 				subject: 'Reset your password on Vizor',
 				text: 'You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n' +
 				'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
 				'http://' + req.headers.host + '/reset/' + token + '\n\n' +
 				'If you did not request this, please ignore this email and your password will remain unchanged.\n'
 			}

 			mailer.send(mail.to, mail.subject, mail.text)
 			.then(function() {
 				req.flash('info', {
 					message: 'An e-mail has been sent to ' + user.email + ' with further instructions.'
 				})
 				done()
 			})
 			.catch(done)
 		}
 		], function(err) {
 			if (err)
 				return next(err)

 			res.redirect('/forgot')
 		})
}
