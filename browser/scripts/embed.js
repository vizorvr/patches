// each one of these will target its own iframe
// <iframe src="/embed/eesn/flamingofront?autoplay=true&noheader=true" width="800" height="450" frameborder="0" allowfullscreen></iframe>
(function(){

	var iframeWindow = {}, iframeElement = {}

	var getId = function() {
		var t = (new Date()).getTime()
		while ((new Date()).getTime() === t) {}
		return t
	}
	var _id = '_v_' + getId()

	var getMyRef = function() {	// where in the document are we
		var spanId = _id + 's'
		document.write('<span id="' + spanId + '"></span>')
		var span = document.getElementById(spanId)
		var script = span.previousElementSibling
		if (script)
			script.parentNode.removeChild(span)
		return script
	}
	
	var script = getMyRef()
	if (!script) {
		console.error('could not find myself')
		return
	}

	var url = ''
	var u = script.attributes.getNamedItem('data-vizorurl')
	if (u) {
		url = u.value
		if (!url)
			return console.error('could not find URL from data-vizorurl')
	}
	else
		return console.error('could not find data-vizorurl')

	// by here we have our script node and its data-url in url

	var n = script.parentNode, r = n.getBoundingClientRect()
	var aspect = 16 / 9

	var iframeWidth = r.width
	var iframeHeight = iframeWidth / aspect
	var iframeId = _id + 'i'

	document.write('<iframe id="'+iframeId+'" src="'+url+
		'" width="99.5%" height="' + iframeHeight +
		'" frameborder="0" style="box-sizing:border-box;" allowfullscreen></iframe>')

	iframeElement = document.getElementById(iframeId)
	iframeWindow = document.getElementById(iframeId).contentWindow

	window.addEventListener('orientationchange', function() {
		iframeWindow.postMessage({ orientation: window.orientation }, '*')
		return true
    }, false)

	var resizeIframe = function() {
		var currentWidth = iframeElement.getBoundingClientRect().width
		if (currentWidth !== iframeWidth) {
			iframeHeight = currentWidth / aspect
			iframeElement.height = iframeHeight
			iframeWidth = currentWidth
		}
		/*
		iframeWindow.postMessage({
			resize: {
				width: iframeWidth,
				height: iframeHeight
			}
		},'*')
		*/
		return true
	}
	window.addEventListener('orientationchange', resizeIframe, true)
	window.addEventListener('resize', resizeIframe, true)

	window.addEventListener('devicemotion', function(deviceMotion) {
		iframeWindow.postMessage({
			devicemotion: {
				accelerationIncludingGravity: {
					x: deviceMotion.accelerationIncludingGravity.x,
					y: deviceMotion.accelerationIncludingGravity.y,
					z: deviceMotion.accelerationIncludingGravity.z
				},
				rotationRate: {
					alpha: deviceMotion.rotationRate.alpha,
					beta: deviceMotion.rotationRate.beta,
					gamma: deviceMotion.rotationRate.gamma
				},
				timeStamp: deviceMotion.timeStamp
			}
		}, '*')
	}, false)

	// log us
	window._v_urls = window._v_urls || []
	window._v_urls.push(url)

})()