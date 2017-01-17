(function() {

var ThreeSixtyPhotoEntityPlugin = E2.plugins.threesixty_photo_entity = function() {
	AbstractEntityPlugin.apply(this, arguments)
	this.desc = '360 Photo Entity Patch'
}

ThreeSixtyPhotoEntityPlugin.prototype = Object.create(AbstractEntityPlugin.prototype)

})()
