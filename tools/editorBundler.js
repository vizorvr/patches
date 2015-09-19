var fs = require('fs')
var path = require('path')
var gulp = require('gulp')
var concat = require('gulp-concat')
var slash = require('gulp-slash')
var uglify = require('gulp-uglify')

var htmlPath = __dirname+'/../views/layouts/editor.handlebars'
var htmlOutPath = __dirname+'/../views/layouts/editor-prod.handlebars'
var scriptName = 'editor-' + Date.now() + '.min.js'

function errorHandler(err) {
	console.error(err.message, err.lineNumber, err.stack)
	this.emit('end')
}

function bundleEditorScripts() {
	if (process.env.NODE_ENV !== 'production') {
		console.log('Not bundling editor (process.env.NODE_ENV is not `production`)')
		return;
	}

	console.log('Building editor bundle')
	// read input html
	var html = fs.readFileSync(htmlPath, { encoding: 'utf8' })

	// parse scripts to concatenate
	var re = /\s?<script type="text\/javascript" src="(.*)"><\/script>$/gim
	var scripts = html.match(re)
	scripts = scripts.map(function(script) {
		return path.resolve(__dirname, '..') + (/src="(.*)"/.exec(script)[1])
			.replace('/scripts/', '/browser/scripts/')
			.replace('/vendor/', '/browser/vendor/')
	})

	scripts.push(path.resolve(__dirname, '..') + '/browser/plugins/all.plugins.js')

	// concat scripts with gulp
	gulp.src(scripts)
	.pipe(slash())
	.pipe(uglify().on('error', errorHandler))
	.pipe(concat(scriptName))
	.pipe(gulp.dest(path.join(__dirname, '..', 'browser', 'scripts')))
	.on('error', errorHandler)

	// remove all scripts
	html = html.replace(
		/<script type="text\/javascript".*<\/script>/gim, '')

	// remove extra white space
	html = html.replace(/\s+/gim, ' ')

	// replace magic with the editor bundle
	html = html.replace('<!-- {{editor.min.js}} -->',
		'<script type="text/javascript" src="/scripts/'+scriptName+'"></script>')

	// write output
	fs.writeFileSync(htmlOutPath, html)
}

exports.bundleEditorScripts = bundleEditorScripts

if (require.main === module) {
	bundleEditorScripts()
}
