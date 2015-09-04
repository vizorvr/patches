var
gulp = require('gulp'),
fs = require('fs'),
path = require('path'),
uglify = require('gulp-uglify'),
concat = require('gulp-concat'),
slash = require('gulp-slash'),
del = require('del'),
less = require('gulp-less'),
preprocess = require('gulp-preprocess'),
paths =
{
	less: './less/build.less',
	js:
	{
		editor: [
			'./browser/vendor/when.js',
			'./browser/node_modules/lodash/dist/lodash.min.js',
			'./browser/vendor/jquery.fastfix.js',
			'./browser/vendor/jquery.mousewheel.js',
			'./browser/vendor/bootstrap-3.1.1-dist/js/bootstrap.min.js',
			'./browser/vendor/js.cookie.min.js',
			'./browser/vendor/bootbox.min.js',
			'./browser/node_modules/backbone/backbone-min.js',
			'./browser/node_modules/handlebars/dist/handlebars.min.js',
			'./browser/node_modules/moment/min/moment.min.js',
			'./browser/scripts/event-emitter.js',
			'./browser/scripts/core.js',
			'./browser/scripts/util.js',
			'./browser/scripts/draggable.js',
			'./browser/scripts/treeview.js',
			'./browser/scripts/context-menu.js',
			'./browser/scripts/file-select-control.js',
			'./browser/scripts/collapsible-select-control.js',
			'./browser/scripts/plugin-group.js',
			'./browser/scripts/plugin-manager.js',
			'./browser/scripts/preset-manager.js',
			'./browser/scripts/peopleManager.js',
			'./browser/scripts/connection.js',
			'./browser/scripts/graph.js',
			'./browser/scripts/node.js',
			'./browser/scripts/node-ui.js',
			'./browser/scripts/registers.js',
			'./browser/scripts/player.js',
			'./browser/scripts/application.js',
			'./browser/scripts/editConnection.js',
			'./browser/scripts/player.js',
			'./browser/scripts/graphApi.js',
			'./browser/scripts/commands/undoManager.js',
			'./browser/scripts/commands/graphEditCommands.js',
			'./browser/scripts/commands/fork.js',
			'./browser/scripts/mid-pane.js',
			'./browser/scripts/shader-editor.js',
			'./browser/scripts/account-controller.js',
			'./browser/scripts/models.js',
			'./browser/scripts/wschannel.js',
			'./browser/scripts/editorChannel.js',
			'./browser/scripts/store.js',
			'./browser/scripts/graphStore.js',
			'./browser/scripts/peopleStore.js',
			'./browser/scripts/noise.js',
			'./browser/scripts/chat.js',
			'./browser/vendor/flux.js',
			'./browser/vendor/three/three.js',
			'./browser/vendor/three/OBJLoader.js',
			'./browser/vendor/three/OBJMTLLoader.js',
			'./browser/vendor/three/MTLLoader.js',
			'./browser/vendor/three/DDSLoader.js',
			'./browser/vendor/three/VREffect.js',
			'./browser/vendor/three/VRControls.js',
			'./browser/vendor/three/webvr-polyfill.js',
			'./browser/vendor/three/webvr-manager.js',
			'./browser/vendor/random.min.js',
			'./browser/scripts/textureCache.js',
			'./browser/scripts/plugin.js',
			'./browser/scripts/subGraphPlugin.js',
			'./browser/scripts/threeObject3dPlugin.js',
			'./browser/scripts/abstractThreeLoaderObjPlugin.js',
			'./browser/scripts/abstractThreeMaterialPlugin.js'

		],
		plugins: './browser/plugins/*.plugin.js',
		player:
		[
			'./browser/vendor/gl-matrix.js',
			'./browser/scripts/util.js',
			'./browser/scripts/connection.js',
			'./browser/scripts/event-emitter.js',
			'./browser/scripts/graph.js',
			'./browser/scripts/node.js',
			'./browser/scripts/registers.js',
			'./browser/scripts/core.js',

			'./browser/scripts/plugin.js',
			'./browser/scripts/subGraphPlugin.js',
			'./browser/scripts/threeObject3dPlugin.js',

			'./browser/scripts/textureCache.js',

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

gulp.task('clean:js:editor', function(cb)
{
	del('./browser/plugins/editor.min.js', cb);
});

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

gulp.task('js:editor', ['clean:js:editor'], function()
{
	gulp.src(paths.js.editor)
	.pipe(slash())
	.pipe(uglify().on('error', errorHandler))
	.pipe(concat('editor.min.js'))
	.pipe(gulp.dest(path.join(__dirname, 'browser', 'scripts')))
	.on('error', errorHandler)
});

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
	.pipe(preprocess({context: { FQDN: process.env.FQDN || 'vizor.io' } }))
	.pipe(uglify().on('error', errorHandler))
	.pipe(concat('player.min.js'))
	.pipe(gulp.dest(path.join(__dirname, 'browser', 'scripts')))
	.on('error', errorHandler)
});

gulp.task('js', ['js:plugins', 'js:player', 'js:editor']);

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

