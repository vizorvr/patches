const gulp = require('gulp')
const fs = require('fs')
const path = require('path')
const uglify = require('gulp-uglify')
const concat = require('gulp-concat-util')
const del = require('del')
const less = require('gulp-less')
const preprocess = require('gulp-preprocess')

const pushPlayerToGrid = require('./tools/pushPlayerToGrid')

var paths = {
	less: './less/build.less',
	less360: './less/build_threesixty.less',
	js: {
		plugins: './browser/plugins/*.plugin.js',
		engine: [
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
			'./browser/scripts/abstractObjectGazePlugin.js',
			'./browser/scripts/abstractThreeLoaderObjPlugin.js',
			'./browser/scripts/abstractThreeMaterialPlugin.js',
			'./browser/scripts/abstractThreeMeshPlugin.js',
			'./browser/scripts/abstractArrayBlendModulatorPlugin.js',
			'./browser/scripts/abstractAnimateValueOnTriggerPlugin.js',
	
			'./browser/scripts/blendFunctions.js',

			'./browser/scripts/worldEditor/worldEditor.js',
			'./browser/scripts/worldEditor/worldEditorPerspectiveCamera.js',
			'./browser/scripts/worldEditor/worldEditorOrthographicCamera.js',
			'./browser/scripts/worldEditor/worldEditorCameraSelector.js',
			'./browser/scripts/worldEditor/worldEditorOriginGrid.js',
			'./browser/scripts/worldEditor/worldEditorRadialHelper.js',

			'./browser/scripts/screenshot/ScreenshotRenderer.js',

			'./browser/scripts/loaders/loader.js',
			'./browser/scripts/loaders/imageLoader.js',
			'./browser/scripts/loaders/textureLoader.js',
			'./browser/scripts/loaders/modelLoader.js',
			'./browser/scripts/loaders/sceneLoader.js',
			'./browser/scripts/loaders/assetLoader.js',
			'./browser/scripts/loaders/audioBufferLoader.js',
			'./browser/scripts/loaders/multiObjectLoader.js',

			'./browser/scripts/documentation/pluginDocsCache.js',

			'./browser/vendor/three/three.js',
			'./browser/vendor/three/OBJLoader.js',
			'./browser/vendor/three/OBJMTLLoader.js',
			'./browser/vendor/three/MTLLoader.js',
			'./browser/vendor/three/DDSLoader.js',
			'./browser/vendor/three/VREffect.js',
			'./browser/vendor/three/CardboardEffect.js',
			'./browser/vendor/three/VRControls.js',
			'./browser/vendor/three/OrbitControls.js',
			'./browser/vendor/three/SceneLoader.js',
			'./browser/vendor/three/MorphAnimMesh.js',

			'./browser/vendor/borismus/webvr-polyfill.js',
			'./browser/vendor/borismus/webvr-manager.js',

			'./browser/scripts/noise.js',
			'./browser/vendor/random.min.js',

			'./browser/scripts/datatypes/environmentSettings.js',

			'./browser/scripts/textureCache.js',

			'./browser/scripts/plugin-manager-bundled.js'
		],

		player: [
			'./browser/plugins/*.plugin.js',
			'./browser/scripts/player.js',
			'./browser/scripts/player-run.js'
		]
	}
}


function errorHandler(err) {
	console.error(err.message, err.lineNumber, err.stack)
	this.emit('end')
}

gulp.task('clean:js:player', function(cb) {
	del('./browser/dist/player.min.js', cb)
})

gulp.task('clean:js:engine', function(cb) {
	del('./browser/dist/engine.js', cb)
})

gulp.task('clean:less360', function(cb)
{
	del('./browser/style/threesixty.css', cb);
});

gulp.task('clean:less', function(cb) {
	del('./browser/style/less.css', cb)
})

gulp.task('clean:js', ['clean:js:player', 'clean:js:engine'])

gulp.task('clean', ['clean:js'])

gulp.task('js:engine', ['clean:js:engine'], function(done) {
	gulp.src(paths.js.engine)
	.pipe(concat.header(';\n'))
	.pipe(concat('engine.js'))
	.pipe(gulp.dest(path.join(__dirname, 'browser', 'dist')))
	.on('error', errorHandler)
	.on('end', done)
})

gulp.task('js:player', ['clean:js:player', 'js:engine'], function(done) {
	var playerPipe = gulp.src(paths.js.engine.concat(paths.js.player))

	// only uglify in production
	if (process.env.NODE_ENV === 'production') {
		playerPipe = playerPipe
			.pipe(uglify().on('error', errorHandler))
	}

	playerPipe
	.pipe(concat.header(';\n'))
	.pipe(concat('player.min.js'))
	.pipe(gulp.dest(path.join(__dirname, 'browser', 'dist')))
	.on('error', errorHandler)
	.on('end', done)
})

gulp.task('push', ['js:player'], function(done) {
	pushPlayerToGrid()
		.then(done, errorHandler)
})

gulp.task('js', ['js:player'])

gulp.task('less', ['clean:less'], function() {
	gulp.src(paths.less)
    .pipe(less({
		paths: [ path.join(__dirname, 'less') ]
    }).on('error', errorHandler))
	.pipe(concat('less.css'))
    .pipe(gulp.dest(path.join(__dirname, 'browser', 'style')))
	.on('error', errorHandler)
})

gulp.task('less360', ['clean:less360'], function() {
	gulp.src(paths.less360)
    .pipe(less({
		paths: [ path.join(__dirname, 'less') ]
    }).on('error', errorHandler))
	.pipe(concat('threesixty.css'))
    .pipe(gulp.dest(path.join(__dirname, 'browser', 'style')))
	.on('error', errorHandler)
});

gulp.task('watch', ['default'], function() {
	gulp.watch('less/**/*', ['less', 'less360']);
	gulp.watch(paths.js.player.concat(paths.js.engine), ['js:player', 'push'])
})

gulp.task('watch:less360', function() {
	gulp.watch('less/threesixty.less', ['less360']);
});

gulp.task('watch:less', function() {
	gulp.watch('less/**/*', ['less'])
})

gulp.task('watch:player', function() {
	gulp.watch(paths.js.player.concat(paths.js.engine), ['js:player', 'push'])
})

gulp.task('golive', ['less', 'less360', 'js'])

gulp.task('default', ['less', 'less360', 'js', 'push'])

