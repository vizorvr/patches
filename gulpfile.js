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
		player:
		[
			'./browser/vendor/gl-matrix.js',
			'./browser/scripts/util.js',
			'./browser/scripts/renderer.js',
			'./browser/scripts/plugin-manager-bundled.js',
			'./browser/scripts/plugin-group.js',
			'./browser/scripts/preset-manager.js',
			'./browser/scripts/connection.js',
			'./browser/scripts/graph.js',
			'./browser/scripts/node.js',
			'./browser/scripts/registers.js',
			'./browser/scripts/core.js',
			'./browser/plugins/*.plugin.js',
			'./browser/scripts/player.js',
			'./browser/scripts/player-run.js'
		]
	}
};

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
	gulp.src('browser/plugins/*.js')
	.pipe(slash())
	.pipe(uglify())
	.pipe(concat('all.plugins.js'))
	.pipe(gulp.dest('./browser/plugins/'))
});

gulp.task('js:player', ['clean:js:player'], function()
{
	gulp.src(paths.js.player)
	.pipe(slash())
	.pipe(uglify())
	.pipe(concat('player.min.js'))
	.pipe(gulp.dest(path.join(__dirname, 'browser', 'scripts')))
});

gulp.task('js', ['js:plugins', 'js:player']);

gulp.task('less', ['clean:less'], function()
{
	gulp.src(paths.less)
	.pipe(slash())
    .pipe(less({
		paths: [ path.join(__dirname, 'less') ]
    }))
	.pipe(concat('less.css'))
    .pipe(gulp.dest(path.join(__dirname, 'browser', 'style')));
});

gulp.task('watch', ['default'], function() {
	gulp.watch('less/**/*', ['less']);
	gulp.watch(paths.js.player, ['js:player']);
});

gulp.task('default', ['less', 'js']);

