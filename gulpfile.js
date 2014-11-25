var
gulp = require('gulp'),
fs = require('fs'),
uglify = require('gulp-uglify'),
concat = require('gulp-concat'),
del = require('del'),
paths =
{
	js:
	{
		player:
		[
			'./browser/vendor/gl-matrix.js',
			'./browser/scripts/util.js',
			'./browser/scripts/renderer.js',
			'./browser/scripts/plugin-manager-bundled.js',
			'./browser/scripts/plugin-group.js',
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

gulp.task('clean:js', ['clean:js:plugins', 'clean:js:player']);

gulp.task('clean', ['clean:js']);

gulp.task('js:plugins', ['clean:js:plugins'], function()
{
	gulp.src('browser/plugins/*.js')
	.pipe(uglify())
	.pipe(concat('all.plugins.js'))
	.pipe(gulp.dest('./browser/plugins/'))
});

gulp.task('js:player', ['clean:js:player'], function()
{
	gulp.src(paths.js.player)
	.pipe(uglify())
	.pipe(concat('player.min.js'))
	.pipe(gulp.dest('./browser/scripts/'))
});

gulp.task('js', ['js:plugins', 'js:player']);

gulp.task('default', ['js']);

