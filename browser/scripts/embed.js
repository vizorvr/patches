// each one of these will target its own iframe
// <iframe src="/embed/eesn/flamingofront?autoplay=true&noheader=true" width="800" height="450" frameborder="0" allowfullscreen></iframe>
(function(){

	var iframeWindow = {}, iframeElement = {}

	var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

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
	var desiredAspect = script.attributes.getNamedItem('data-aspect')
	if (desiredAspect) {
		desiredAspect = parseFloat(desiredAspect.value)
		if (!isNaN(desiredAspect))
			aspect = desiredAspect
	}

	var iframeWidth = r.width * 0.995
	var iframeHeight = iframeWidth / aspect
	var iframeId = _id + 'i'


	window.addEventListener('orientationchange', function() {
		iframeWindow.postMessage({ orientation: window.orientation }, '*')
		return true
    }, false)

	var resizeIframe = function() {
		var d = iframeElement.style.display
		iframeElement.style.display = 'none'
		var currentWidth = iframeElement.parentNode.getBoundingClientRect().width * 0.995
		if (currentWidth !== iframeWidth) {
			iframeWidth = currentWidth
			iframeHeight = iframeWidth / aspect
			iframeElement.width = iframeWidth
			iframeElement.height = iframeHeight
		}
		iframeElement.style.display = d
		return true
	}

	document.write('<iframe id="'+iframeId+'" src="'+url+
		'" width="'+ iframeWidth +'" height="' + iframeHeight +
		'" frameborder="0" style="box-sizing:border-box;" allowfullscreen></iframe>')

	iframeElement = document.getElementById(iframeId)
	iframeWindow = document.getElementById(iframeId).contentWindow

	resizeIframe()
	
	// fix resizing issues with android
	// android issues orientationchange->resize, ios issues resize->orientationchange
	window.addEventListener('orientationchange', function(){
		setTimeout(resizeIframe, 500)
	}, true)
	window.addEventListener('resize', resizeIframe)

	if (iOS) {
		window._dm = window._dm || {}
		window.addEventListener('devicemotion', function (deviceMotion) {
			window._dm[iframeId] = {
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
			}
			iframeWindow.postMessage(window._dm[iframeId], '*')
			return true
		}, false)
	}

	// log us
	window._v_urls = window._v_urls || []
	window._v_urls.push(url)

	window.addEventListener('load', resizeIframe)
})()