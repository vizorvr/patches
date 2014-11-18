var gulp = require('gulp');
var handlebars = require('gulp-handlebars');
var wrap = require('gulp-wrap');
var declare = require('gulp-declare');
var concat = require('gulp-concat');
var through = require('through');

var cache = '';

function TemplateCache() {}

TemplateCache.prototype.compile = function compile()
{
	if (cache)
		return;

	var sourcePaths = [
		__dirname+'/../views/**/*.handlebars',
		'!'+__dirname+'/../views/layouts/*.handlebars',
		'!'+__dirname+'/../views/*.handlebars',
	];

	gulp.src(sourcePaths)
	.pipe(handlebars())
	.pipe(wrap('Handlebars.template(<%= contents %>)'))
	.pipe(declare(
	{
		namespace: 'E2',
		noRedeclare: true, // Avoid duplicate declarations
		processName: declare.processNameByPath
	}))
	.pipe(concat('templates.js'))
	.on('data', function(data) {
		cache += data.contents;
	});

	return this;
};

TemplateCache.prototype.helper = function()
{
	return {
		templateCache: function()
		{
			return cache;
		}
	};
};

module.exports = TemplateCache;
