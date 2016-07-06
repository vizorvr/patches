var fs = require('fs')
var path = require('path')
var gulp = require('gulp')
var concat = require('gulp-concat')
var slash = require('gulp-slash')
var uglify = require('gulp-uglify')

const packageJson = JSON.parse(fs.readFileSync(__dirname+'/../package.json'))
const currentVersion = packageJson.version

const argv = require('minimist')(process.argv.slice(2))

const layoutName = argv._[0]
const includePlugins = !!argv.i || layoutName === 'editor'

if (!layoutName) {
	console.error('usage: '+process.argv[1]+' layoutName')
	process.exit(1)
}

var htmlPath = __dirname+'/../views/layouts/'+layoutName+'.handlebars'
var htmlOutPath = __dirname+'/../views/layouts/'+layoutName+'-bundled.handlebars'
var scriptName = layoutName+'-' + currentVersion + '.min.js'

function errorHandler(err) {
	console.error(err.message, err.lineNumber, err.stack)
	this.emit('end')
}

function bundleLayoutScripts() {
	if (process.env.NODE_ENV !== 'production') {
		console.log('Not bundling layout '+layoutName+' (process.env.NODE_ENV is not `production`)')
		return;
	}

	console.log('Building layout bundle', layoutName)

	// read input html
	var html = fs.readFileSync(htmlPath, { encoding: 'utf8' })

	var beginMarker = '<!-- begin bundler -->'
	var endMarker = '<!-- end bundler -->'

	var beginOffset = html.indexOf(beginMarker)
	var endOffset = html.indexOf(endMarker)

	var beforeHtml = html.substring(0, beginOffset)
	var bundlerHtml = html.substring(beginOffset + beginMarker.length, endOffset)
	var afterHtml = html.substring(endOffset + endMarker.length)

	// parse scripts to concatenate
	var re = /\s?<script( type="text\/javascript")? src="(.*)"><\/script>$/gim
	var scripts = bundlerHtml.match(re)
	scripts = scripts.map(function(script) {
		var scriptPath = /src="(.*)"/.exec(script)[1]
			.substring(1)
			.replace(/^scripts\//, 'browser/scripts/')
			.replace(/^dist\//, 'browser/dist/')
			.replace(/^vendor\//, 'browser/vendor/')
			.replace(/^common\//, 'common/')

		scriptPath = path.resolve(__dirname, '..', scriptPath)

		// make sure script is there. will throw if not
		fs.statSync(scriptPath)
		
		return scriptPath
	})

	console.log('  scripts found', scripts.length)

	// add plugins
	if (includePlugins) {
		scripts.push(path.resolve(__dirname, '..') + '/browser/plugins/*.plugin.js')
	}

	var scriptFolder = path.join(__dirname, '..', 'browser', 'dist')
	var scriptPath = scriptFolder+'/'+scriptName

	// concat scripts with gulp
	gulp.src(scripts)
	.pipe(slash())
	.pipe(uglify().on('error', errorHandler))
	.pipe(concat(scriptName))
	.pipe(gulp.dest(scriptFolder))
	.on('error', errorHandler)
	.on('end', function() {
		html = beforeHtml + '\n'
		html += '<script type="text/javascript" src="/dist/'+scriptName+'"></script>\n'
		html += afterHtml

		// write output layout
		fs.writeFileSync(htmlOutPath, html)

		var stat = fs.statSync(scriptPath)

		console.log('  bundle', scriptName, 'is', Math.round(stat.size / 1024) + ' kB')
	})
}

exports.bundleLayoutScripts = bundleLayoutScripts

if (require.main === module) {
	bundleLayoutScripts()
}
