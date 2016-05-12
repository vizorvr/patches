/**
 * @author mrdoob / http://mrdoob.com/
 */

THREE.FontLoader = function ( manager ) {

	this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;

};

THREE.FontLoader.prototype = {

	constructor: THREE.FontLoader,

	load: function ( url, onLoad, onProgress, onError ) {

		var loader = new THREE.XHRLoader( this.manager );
		loader.load( url, function ( text ) {

			var fontDataMarker = 'loadFace('
			var fontDataStart = text.indexOf(fontDataMarker)

			var fontData = text
			if (fontDataStart === -1) {
				fontData = text
			}
			else {
				fontData = text.substring( fontDataStart + fontDataMarker.length, text.length - 2 )
			}

			onLoad( new THREE.Font( JSON.parse( fontData ) ) );

		}, onProgress, onError );

	}

};
