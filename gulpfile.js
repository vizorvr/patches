var
gulp = require('gulp'),
fs = require('fs'),
path = require('path'),
uglify = require('gulp-uglify'),
concat = require('gulp-concat-util'),
slash = require('gulp-slash'),
del = require('del'),
less = require('gulp-less'),
preprocess = require('gulp-preprocess'),
paths = {
	less: './less/build.less',
	js: {
		plugins: './browser/plugins/*.plugin.js',
		player:
		[
			'./browser/vendor/when.js',

			'./browser/scripts/event-emitter.js',
			'./browser/scripts/core.js',
			'./browser/scripts/util.js',

			'./browser/scripts/connection.js',
			'./browser/scripts/variables.js',
			'./browser/scripts/graph.js',
			'./browser/scripts/node.js',
			'./browser/scripts/autoSlotGroup.js',

			'./browser/scripts/plugin.js',
			'./browser/scripts/subGraphPlugin.js',
			'./browser/scripts/threeObject3dPlugin.js',
			'./browser/scripts/abstractThreeLoaderObjPlugin.js',
			'./browser/scripts/abstractThreeMaterialPlugin.js',
			'./browser/scripts/abstractThreeMeshPlugin.js',
		
			'./browser/scripts/worldEditor/worldEditor.js',
			'./browser/scripts/worldEditor/worldEditorCamera.js',
			'./browser/scripts/worldEditor/worldEditorOriginGrid.js',

			'./browser/scripts/loaders/loaders.js',
			'./browser/scripts/loaders/assetLoader.js',
			'./browser/scripts/loaders/multiObjectLoader.js',

			'./browser/vendor/three/three.js',
			'./browser/vendor/three/OBJLoader.js',
			'./browser/vendor/three/OBJMTLLoader.js',
			'./browser/vendor/three/MTLLoader.js',
			'./browser/vendor/three/DDSLoader.js',
			'./browser/vendor/three/VREffect.js',
			'./browser/vendor/three/VRControls.js',
			'./browser/vendor/three/SceneLoader.js',
			'./browser/vendor/three/MorphAnimMesh.js',
			'./browser/vendor/three/webvr-polyfill.js',
			'./browser/vendor/three/webvr-manager.js',

			'./browser/scripts/noise.js',
			'./browser/vendor/random.min.js',

			'./browser/scripts/datatypes/environmentSettings.js',

			'./browser/scripts/textureCache.js',

			'./browser/scripts/plugin-manager-bundled.js',
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

gulp.task('clean:js:player', function(cb)
{
	del('./browser/scripts/player.min.js', cb);
});

gulp.task('clean:less', function(cb)
{
	del('./browser/style/less.css', cb);
});

gulp.task('clean:js', ['clean:js:player']);

gulp.task('clean', ['clean:js']);

gulp.task('js:player', ['clean:js:player'], function()
{
	gulp.src(paths.js.player)
	.pipe(slash())
	.pipe(preprocess({context: { FQDN: process.env.FQDN || 'vizor.io' } }))
	.pipe(uglify().on('error', errorHandler))
	.pipe(concat.header(';\n'))
	.pipe(concat('player.min.js'))
	.pipe(gulp.dest(path.join(__dirname, 'browser', 'scripts')))
	.on('error', errorHandler)
});

gulp.task('js', ['js:player']);

gulp.task('less', ['clean:less'], function() {
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
	gulp.watch(paths.js.player, ['js:player']);
});

gulp.task('watch:less', function() {
	gulp.watch('less/**/*', ['less']);
});

gulp.task('watch:player', function() {
	gulp.watch(paths.js.player, ['js:player']);
});

gulp.task('default', ['less', 'js']);

