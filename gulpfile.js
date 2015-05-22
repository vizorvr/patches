var
gulp = require('gulp'),
fs = require('fs'),
path = require('path'),
uglify = require('gulp-uglify'),
concat = require('gulp-concat'),
slash = require('gulp-slash'),
del = require('del'),
less = require('gulp-less'),
paths =
{
	less: './less/build.less',
	js:
	{
		plugins: './browser/plugins/*.plugin.js',
		player:
		[
			'./browser/vendor/gl-matrix.js',
			'./browser/scripts/util.js',
			'./browser/scripts/texture.js',
			'./browser/scripts/mesh.js',
			'./browser/scripts/scene.js',
			'./browser/scripts/material.js',
			'./browser/scripts/renderer.js',
			'./browser/scripts/shader.js',
			'./browser/scripts/connection.js',
			'./browser/scripts/event-emitter.js',
			'./browser/scripts/graph.js',
			'./browser/scripts/node.js',
			'./browser/scripts/registers.js',
			'./browser/scripts/core.js',

			'./browser/scripts/plugin.js',
			'./browser/scripts/subGraphPlugin.js',
			'./browser/scripts/plugin-manager-bundled.js',
			'./browser/scripts/plugin-group.js',
			'./browser/plugins/*.plugin.js',

			'./browser/scripts/player.js',
			'./browser/scripts/player-run.js'
		]
	}
};

function errorHandler(err) {
	console.error(err.message, err.lineNumber, err.stack)
	this.emit('end')
}

gulp.task('clean:js:plugins', function(cb)
{
	del('./browser/plugins/all.plugins.js', cb);
});

gulp.task('clean:js:player', function(cb)
{
	del('./browser/scripts/player.min.js', cb);
});

gulp.task('clean:less', function(cb)
{
	del('./browser/style/less.css', cb);
});

gulp.task('clean:js', ['clean:js:plugins', 'clean:js:player']);

gulp.task('clean', ['clean:js']);

gulp.task('js:plugins', ['clean:js:plugins'], function()
{
	gulp.src(paths.js.plugins)
	.pipe(slash())
	.pipe(uglify().on('error', errorHandler))
	.pipe(concat('all.plugins.js'))
	.pipe(gulp.dest(path.join(__dirname, 'browser', 'plugins')))
	.on('error', errorHandler)
});

gulp.task('js:player', ['clean:js:player'], function()
{
	gulp.src(paths.js.player)
	.pipe(slash())
	.pipe(uglify().on('error', errorHandler))
	.pipe(concat('player.min.js'))
	.pipe(gulp.dest(path.join(__dirname, 'browser', 'scripts')))
	.on('error', errorHandler)
});

gulp.task('js', ['js:plugins', 'js:player']);

gulp.task('less', ['clean:less'], function()
{
	gulp.src(paths.less)
	.pipe(slash())
    .pipe(less({
		paths: [ path.join(__dirname, 'less') ]
    }).on('error', errorHandler))
	.pipe(concat('less.css'))
    .pipe(gulp.dest(path.join(__dirname, 'browser', 'style')))
	.on('error', errorHandler)
});

gulp.task('watch', ['default'], function() {
	gulp.watch('less/**/*', ['less']);
	gulp.watch(paths.js.plugins, ['js:plugins']);
	gulp.watch(paths.js.player, ['js:player']);
});

gulp.task('watch:less', function() {
	gulp.watch('less/**/*', ['less']);
});

gulp.task('watch:player', function() {
	gulp.watch(paths.js.plugins, ['js:plugins']);
	gulp.watch(paths.js.player, ['js:player']);
});

gulp.task('default', ['less', 'js']);

