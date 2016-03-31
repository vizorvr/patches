// <iframe src="/embed/eesn/flamingofront?autoplay=true&noheader=true" width="800" height="450" frameborder="0" allowfullscreen></iframe>
(function(){

	var iframe = {}

	var getId = function() {
		var t = (new Date()).getTime()
		while ((new Date()).getTime() === t) {}
		return t
	}
	var _id = '_v_' + getId()

	var getParentRef = function() {
		var spanId = _id + 's'
		document.write('<span id="' + spanId + '"></span>')
		var ts = document.getElementById(spanId)
		var n = ts.parentNode
		n.removeChild(ts)
		return n
	}

	var n = getParentRef(), r = n.getBoundingClientRect()
	var aspect = 16 / 9

	var iframeWidth = r.width || 800
	var iframeHeight = iframeWidth / aspect
	var iframeId = _id + 'i'

	var url = ''
	var scripts = document.getElementsByTagName('script')
	Array.prototype.forEach.call(scripts, function(s){
		if (s.dataset['vizorurl'])
			url = s.dataset['vizorurl']
	})

	document.write('<iframe id="'+iframeId+'" src="'+url+
		'" width="' + iframeWidth + 
		'" height="' + iframeHeight +
		'" frameborder="0" allowfullscreen></iframe>')

	iframe = document.getElementById(iframeId).contentWindow

	window.addEventListener('orientationchange', function() {
            iframe.postMessage({ orientation: window.orientation }, '*')
    }, false)

	window.addEventListener('devicemotion', function(deviceMotion) {
		iframe.postMessage({
			devicemotion: {
				accelerationIncludingGravity: {
					x: deviceMotion.accelerationIncludingGravity.x,
					y: deviceMotion.accelerationIncludingGravity.y,
					z: deviceMotion.accelerationIncludingGravity.z,
				},
				rotationRate: {
					alpha: deviceMotion.rotationRate.alpha,
					beta: deviceMotion.rotationRate.beta,
					gamma: deviceMotion.rotationRate.gamma,
				},
				timeStamp: deviceMotion.timeStamp
			}
		}, '*')
	}, false)


})()