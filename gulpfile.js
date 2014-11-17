var gulp = require('gulp');
var fs = require('fs');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');

gulp.task('plugins', function()
{
	try {
		fs.unlinkSync('./browser/plugins/all.plugins.js');
	} catch(e) {}

	gulp.src('browser/plugins/*.js')
		.pipe(uglify())
		.pipe(concat('all.plugins.js'))
		.pipe(gulp.dest('./browser/plugins/'))
});
