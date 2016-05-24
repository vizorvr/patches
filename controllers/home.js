function getHomeFeaturedScenes() {
	var scenes = {}

	function scene(username, path, ownerName, sceneName) {
		return {
			graphName: sceneName,
			graphOwner: ownerName,
			graphOwnerLink: "//vizor.io/" + username,
			previewUrlSmall: "//vizor.io/data/previews/"+username+"/"+path+"-preview-440x330.png",
			path: "//vizor.io/"+username+"/"+path
		}
	}

	// stopgap solution before featured-sorted-limited lists from db
	function cull(array) {
		array.sort( function() { return 0.5 - Math.random() } ) // shuffle
		return array.slice(0,3)
	}

	// e.g. (vizor.io) /username/scene  (user full name, scene full name)
	scenes.threesixty = cull([
		scene('examples','360-photo', "Vizor examples", "360 Photo"),
		scene('eerussell','hijono', "Emily", "Hi Jono"),
		scene('visualgimmicks','area-51', "Miguelangelo Rosario", "Area 51"),
		scene('novasfronteiras','cambo', "Novas Fronteiras", "Cambo"),
		scene('reiska','simple-360', "Reiska", "Simple 360"),
		scene('annarosa','kingston_from_port_royal2', "Anna Rosa Lappalainen", "Kingston from Port Royal"),
		scene('india','india3', "India", "India 3"),
		scene('india','india9', "India", "India 9")
	])

	scenes.threedscenes = cull([
		scene('jexnguyen', 'science-guru', 'Jex', 'Science Guru'),
		scene('phinguyen', 'peaceful', 'Phi', 'Peaceful'),
		scene('usersarelosers', 'hidden_agenda', 'Gareth Hellenthal', 'Hidden Agenda'),
		scene('edelblut', 'space-adventure', 'Jeremy', 'Space Adventure'),
		scene('edelblut', 'mountain_top_wip_02', 'Jeremy', 'Mountain Top 02'),
		scene('edelblut', 'lab_with_some_characters', 'Jeremy', 'Lab with some characters')
	])
	
	scenes.architecture = cull([
		scene('fthr', 'midtown-manhattan-flythrough-3', 'fthr', 'Midtown Manhattan Flythrough 3'),
		scene('tastychicken', 'blending', 'G Wilson', 'Blending'),
		scene('tastychicken', '3d_file', 'G Wilson', '3D File')
	])
	
	scenes.experiments = cull([
		scene('chegwin', 'yellow', 'Stephanie Hayes', 'Yellow'),
		scene('iantruelove', 'spherewalker1', 'Ian Truelove', 'Spherewalker 1'),
		scene('fthr', 'spaceship-harddisk-3', 'fthr', 'Spaceship Harddisk 3'),
		scene('fthr', 'buddha-homecam-4', 'fthr', 'Buddha Homecam 4'),
		scene('fthr', '2nda', 'fthr', '2nd a'),
		scene('fthr', 'snoop-space-2', 'fthr', 'Snoop Space 2'),
		scene('fthr', 'exploding-rocket-5', 'fthr', 'Exploding Rocket 5'),
		scene('edelblut', 'just_a_doodle_01', 'Jeremy', 'Just a Doodle 01')
	])

	scenes.interactive = cull([
		scene('fthr', 'buddha-head-statue-roomscale', 'fthr', 'Buddha Head Statue Roomscale'),
		scene('matt', 'planet-viewer', 'Matt', 'Planet Viewer'),
		scene('gloria', 'glorian-kulisseissa', 'Gloria', 'Glorian Kulisseissa'),
		scene('matt', 'rocket-launcher-v2', 'Matt', 'Rocket Launcher v2')
	])

	return scenes
}

/**
 * GET /
 * Home page.
 */
exports.index = function(req, res)  {
	res.render('home', {
		layout: 'main',
		featured: getHomeFeaturedScenes(),
		meta : {
			bodyclass : 'bHome bIndex',
			noheader: true
		}
	})
}


/**
 * GET /about
 * Home > about
 */
exports.about = function(req, res)  {
	res.render('server/pages/about', {
		layout: 'main',
		meta : {
			bodyclass : 'bHome bAbout',
			title: "About Vizor - Explore, Create and Publish VR on the Web",
			noheader: true
		}
	})
}