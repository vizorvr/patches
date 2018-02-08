const request = require('supertest')
const when = require('when')
const fs = require('fs-extra')
const fsPath = require('path')
const urlParse = require('url').parse
const _ = require('lodash')
const Handlebars = require('handlebars')
const cheerio = require('cheerio')
const guard = require('when/guard')

var argv = require('minimist')(process.argv.slice(2))

if (argv._.length < 1) {
	console.log(`
	usage:

		$ export graphUrl [folder] [root]

			exports the graph from the remote url to local folder
			- retrieves assets and remaps the paths to work locally under 'root'
			- use the root option to put assets in a specific folder
			- folder name defaults to basename of graph
			- root defaults to /

			$ export fthr/tunnel ./tunnel assets

			pulls fthr/tunnel from patches.vizor.io to local folder tunnel,
			and remaps the asset paths to be under 'assets'
	`)

	process.exit(1)
}

var graphUrl = argv._[0]
var chroot = argv._[2] || ''
var parsed = urlParse(graphUrl)
var hn = (parsed.hostname || 'patches.vizor.io') + ':' + (parsed.port || 443)

if (chroot !== '' && chroot[0] !== '/')
	chroot = '/' + chroot

var userAndGraph = parsed.path
	.split('.')[0] // remove extensions
	.split('/')

if (userAndGraph[userAndGraph.length-1] === 'edit')
	userAndGraph.pop()

userAndGraph = userAndGraph.slice(-2) // last two parts

var folder = argv._[1] || fsPath.basename(graphUrl)
folder = folder + chroot

console.log('things', userAndGraph, folder)

userAndGraph = userAndGraph.join('/')

var graphModelUrl = '/' + userAndGraph +'.json'
var htmlUrl = '/' + userAndGraph

var remoteHttp = 'https://'+hn
var cdnHttp = 'https://cdn.vizor.io:443'
var remote = request.agent(remoteHttp)
var cdn = request.agent(cdnHttp)

console.log('Consuming', remoteHttp, cdnHttp)

var loadingPlugins = [
	'three_loader_model',
	'three_loader_scene',
	'url_texture_generator',
	'url_cubemap_generator',
	'url_stereo_cubemap_generator',
	'url_stereo_latlongmap_generator',
	'url_audio_buffer_generator',
	'url_audio_generator',
	'url_json_generator',
	'url_video_generator',
]

function error(err) {
	console.error(err.stack)
	process.exit(1)
}

function saveGraph(graphData) {
	var dfd = when.defer()

	var path = fsPath.join(folder, 'graph.json')

	fs.writeFile(path, JSON.stringify(graphData, null, 2), (err) => {
		if (err)
			return dfd.reject(err)

		dfd.resolve()
	})

	return dfd.promise
}

function mirror(remoteUrl, i, realName) {
	var dfd = when.defer()
	let agent = remoteUrl.indexOf('/data') === 0 ? cdn : remote
	let getUrl = remoteUrl.replace(/^\/data/, '')
	let dest = folder+remoteUrl
	if (realName)
		dest = folder + realName
	var dirname = fsPath.dirname(dest)

	if (!getUrl) {
		return dfd.resolve()
	}

	agent.head(getUrl)
	.end((err, head) => {
		if (err)
			return dfd.reject(err)

		if (head.statusCode !== 200)
			console.log('  HEAD', getUrl, head.statusCode)

		if (head.statusCode === 301) {
			let redUrl = head.headers.location.replace('https://cdn.vizor.io', '/data')
			console.log('  REDIRECT', redUrl)
			return mirror(redUrl, 0, getUrl).then(() => { return dfd.resolve(getUrl) })
		}

		if (head.statusCode === 404)
			return dfd.resolve()

		fs.mkdirs(dirname, (err) => {
			if (err)
				return dfd.reject(err)

			console.log('GET', getUrl, 'from', agent === cdn ? 'cdn' : 'site', dest)

			if (getUrl.indexOf('.obj') !== -1) {
				var mtlUrl = getUrl.replace('.obj', '.mtl')
				dfd.promise.then(() => { return mirror(mtlUrl) })
			}

			if (getUrl.indexOf('.ogg') !== -1) {
				var m4aUrl = getUrl.replace('.ogg', '.m4a')
				dfd.promise.then(() => { return mirror(m4aUrl) })
			}

			if (remoteUrl.indexOf('/data') === 0) {
				var metaUrl = '/meta' + getUrl
				dfd.promise.then(() => { return mirror(metaUrl) })
			}

			var writeStream = fs.createWriteStream(dest)

			agent.get(getUrl)
			.pipe(writeStream)
			.on('close', () => {
				console.log('  OK', remoteUrl)
				dfd.resolve(getUrl)
			})
		})

	})

	return dfd.promise
}

var nestedPatches = ['graph', 'entity']

function relocateAsset(url) {
	return chroot + url
}

function readAssets(subgraph, assets) {
	assets = assets || [
		'/data/textures/loadingtex.png',
		'/data/textures/defaulttex.png'
	]

	if (!subgraph.nodes)
		return

	subgraph.nodes.map((node) => {
		if (nestedPatches.indexOf(node.plugin) !== -1)
			return readAssets(node.graph, assets)

		if (loadingPlugins.indexOf(node.plugin) === -1)
			return;

		assets.push(node.state.url)

		node.state.url = relocateAsset(node.state.url)
	})

	return _.uniq(assets)
}

// --------
function readPlayerHtml(htmlUrl) {
	var dfd = when.defer()

	console.log('Retrieving html:', htmlUrl)

	remote.get(htmlUrl)
	.expect(200)
	.end((err, res) => {
		if (err)
			return dfd.reject(err)

		dfd.resolve(res.text)
	})

	return dfd.promise
}

function retrieveGraphAndAssets() {
	return readJson(graphModelUrl)
	.then(([meta, graph]) => {
		var assets = readAssets(graph.root)

		return when.map(assets, mirror)
		.then(() => {
			return saveGraph(graph)
		})
		.then(() => {
			return meta
		})
	})
}

function readJson(url) {
	var dfd = when.defer()

	remote.get(url)
	.expect(200)
	.end((err, res) => {
		if (err)
			return dfd.reject(err)

		let model = res.body
		let graphUrl = model.url.replace(/^\/data/, '')

		console.log('Retrieving Graph', graphUrl)

		cdn.get(graphUrl)
		.end((err, res) => {
			if (err)
				return dfd.reject(err)

			dfd.resolve([model, res.body])
		})
	})

	return dfd.promise
}

readPlayerHtml(htmlUrl)
.then((html) => {
	var $ = cheerio.load(html)

	// grab styles and scripts to retrieve
	var styles = []
	$('link').each((i, link) => {
		styles.push(link.attribs.href)
	})

	var scripts = []
	$('script').each((i, script) => {
		if (!script.attribs.src)
			return

		scripts.push(script.attribs.src)
	})

	return when.map(styles.concat(scripts), mirror)
	.then(retrieveGraphAndAssets)
	.then(meta => {
		meta.scripts = scripts
		meta.styles = styles
		return meta
	})
})
.then(templateData => {
	console.log('templatedata', templateData)
	templateData.graphUrl = 'graph.json'

	console.log('Rendering', templateData)
	var templateSource = fs.readFileSync('./export.handlebars').toString()
	var template = Handlebars.compile(templateSource)
	var html = template(templateData)
	fs.writeFileSync(folder+'/'+'index.html', html)
})
.catch(error)
