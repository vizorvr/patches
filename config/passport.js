var _ = require('lodash');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/user');
var secrets = require('./secrets');

passport.serializeUser(function(user, done)
{
	done(null, user.id);
});

passport.deserializeUser(function(id, done)
{
	User.findById(id, function(err, user)
	{
		done(err, user);
	});
});

// Sign in using Email and Password.
passport.use(new LocalStrategy({ usernameField: 'email' }, function(email, password, done)
{
	User.findOne({ email: email }, function(err, user)
	{
		if (!user)
			return done(null, false, { message: 'Email ' + email + ' not found'});

		user.comparePassword(password, function(err, isMatch)
		{
			if (isMatch)
			{
				return done(null, user);
			} else
			{
				return done(null, false, { message: 'Invalid email or password.' });
			}
		});
	});
}));

// Login Required middleware.
exports.isAuthenticated = function(req, res, next)
{
	if (req.isAuthenticated())
		return next();

	res.redirect('/login');
};

// Authorization Required middleware.
exports.isAuthorized = function(req, res, next)
{
	var provider = req.path.split('/').slice(-1)[0];

	if (_.find(req.user.tokens, { kind: provider }))
	{
		next();
	} else
	{
		res.redirect('/auth/' + provider);
	}
};
