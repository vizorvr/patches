var gulp = require('gulp')
var handlebars = require('gulp-handlebars')
var wrap = require('gulp-wrap')
var declare = require('gulp-declare')
var concat = require('gulp-concat')
var path = require('path')
var diyHbsHelpers = require('diy-handlebars-helpers')
var hbsHelpers = require('./hbs-helpers')

var views = ''
var partials=''
var helpers=''
var opts = {}

function TemplateCache() {}

TemplateCache.prototype.recompile = function(cb) {
	views = ''
	partials = ''
	helpers = ''
	return this.compile(cb)
}
TemplateCache.prototype.setHbs = function(hbs) {
	opts.handlebars = hbs
}

TemplateCache.prototype.compile = function(cb) {
	if (partials && helpers && views) {
		return cb && cb()
	}

	var partialPaths = [
		__dirname+'/../views/partials/**/*.handlebars'
		// server/partials not in cache
	]

	var sourcePaths = [
		__dirname+'/../views/**/*.handlebars',
		'!'+__dirname+'/../views/server/**/*.handlebars',
		'!'+__dirname+'/../views/layouts/*.handlebars',
		'!'+__dirname+'/../views/graph/*.handlebars',
		'!'+__dirname+'/../views/*.handlebars'
	]

	// registers diyHbsHelpers and hbsHelpers to use client-side
	function makeHelpers() {
		var helpersJs = []
		var key
		for (key in diyHbsHelpers) {
			if (key !== 'templateCache')
				helpersJs.push("Handlebars.registerHelper('" + key + "'," + diyHbsHelpers[key].toString()+");")
		}
		for (key in hbsHelpers) {
			helpersJs.push("Handlebars.registerHelper('" + key + "'," + hbsHelpers[key].toString()+");")
		}
		return helpers = helpersJs.join("\n")
	}

	function makePartials() {
		return gulp.src(partialPaths)
			.pipe(handlebars(opts))
			.pipe(wrap('Handlebars.registerPartial(<%= processPartialName(file.relative) %>, <%= partialToE2Name(file.relative) %>);', {}, {
				imports: {
					// makes a name for a partial from its filename, e.g. assets/graphCard
					processPartialName: function (fileName) {
						var parts = fileName.split('/')
						var prefix = ''
						if (parts.length > 1) {
							parts.pop()
							prefix = parts.pop() + '/'
						}
						var n = prefix + path.basename(fileName, '.js')	// gulp
						return JSON.stringify(n)
					},
					// maps a partial to its E2.views.partials precompiled template
					partialToE2Name: function (fileName) {
						var name = path.basename(fileName, '.js')
						fileName = fileName.split('/')
						fileName.pop()		// name.js
						fileName.push(name)	// name
						return "E2.views.partials." + fileName.join(".")
					}
				}
			}))
			.pipe(concat('partials'))
			.on('data', function (data) {
				partials += data.contents
			})
			.on('end', function () {
				if (cb)
					cb()
			})
	}


	function makeTemplates(cb) {
		return gulp.src(sourcePaths)
			.pipe(handlebars(opts))
			.pipe(wrap('Handlebars.template(<%= contents %>)'))
			.pipe(declare({
				namespace: 'E2',
				noRedeclare: true, // Avoid duplicate declarations
				processName: declare.processNameByPath
			}))
			.pipe(concat('templates'))
			.on('data', function (data) {
				views += data.contents
			})
			.on('end', function () {
				if (cb)
					cb()
			})
	}

	makeHelpers()				// sets helpers
	makeTemplates(function(){	// sets cache
		makePartials(cb)		// sets partials
	})

	// not a bad idea to make this into a file and serve it separately
	return this
}

TemplateCache.prototype.helper = function() {
	return {
		templateCache: function() {
			return helpers + views + partials
		}
	}
}

module.exports = TemplateCache
