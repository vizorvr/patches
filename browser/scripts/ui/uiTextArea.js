/**
 * custom-resizable text area housed in a div container
 * the change handlers will be called upon text entry and resizing, as follows:
 * textarea: focus = begin,  change = end, blur = end
 * resizer:  dragstart = begin, drag = change, dragend = end
 *
 * @param adapter - object containing {text, width, height} properties.
 * @param onBeginChange function|null called as described above
 * @param onChange
 * @param onEndChange
 * @uses UIDragAwareHelper
 * @constructor
 */
var UITextArea = function(adapter, onBeginChange, onChange, onEndChange) {
	var that = this

	var paddingPx = 2
	var borderPx = 0

	var dummyCall = function() { return true }
	onBeginChange = onBeginChange || dummyCall
	onChange = onChange || dummyCall
	onEndChange = onEndChange || dummyCall

	var container = $('<div style="position:relative"></div>')
	var textarea = $('<textarea style="background:transparent" placeholder="Type text here" />')
	var resizer = $('<svg class="resizecorner"><use xlink:href="#resizecorner"></use></svg>')

	container.append(textarea)
	container.append(resizer)
	container.css({
		'padding-top': '2px',
		'width':		adapter.width + 'px',
		'height':		adapter.width + 'px',
		'margin': 		'5px 0px 2px 18px'
	})
	container.addClass('uiTextArea')

	textarea.css({
		'font-size'	: '8.7pt',
		'line-height': '1.45',
		'border'	: borderPx + 'px solid #999',
		'margin'	: '0 0 5px 0',
		'padding'	: paddingPx + 'px',
		'resize' 	: 'none',
		'position' 	: 'absolute',
		'z-index' 	: 1,
		'width'		: adapter.width + 'px',
		'height'	: adapter.width + 'px',
		'pointer-events': 'initial'
	})
		.addClass('wkForceSubpixel scrollbar')

	resizer.css({
		'position' 	: 'absolute',
		'bottom' 	: '-8px',
		'right' 	: '-8px',
		'z-index' 	: 2
	})

	var drag = this.dragAware = new UIDragAwareHelper(resizer[0])
	var ow = adapter.width, oh = adapter.height

	resizer.on(drag.dragEvents.start, function() {
		textarea.trigger('blur')
		ow = adapter.width
		oh = adapter.height
		onBeginChange()
	})

	resizer.on(drag.dragEvents.move, function(e) {
		var data = e.originalEvent.detail
		if (! (data && data.delta)) return
		var dx = data.startDelta.x, dy = data.startDelta.y
		adapter.width = ow + dx
		adapter.height = oh + dy
		onChange()
	})

	resizer.on(drag.dragEvents.end, onEndChange)

	textarea.on('focus', onBeginChange)
	textarea.on('change blur', function(){
		adapter.text = textarea.val()
		onEndChange()
	})

	this.dom = container

	this.update = function() {
		textarea.val(adapter.text)

		if (adapter.width > 0) {
			textarea.css('width', adapter.width +  2*paddingPx + 2* borderPx + 'px')
			container.css('width', adapter.width +  2*paddingPx + 2* borderPx + 'px')
		}

		if (adapter.height > 0) {
			textarea.css('height', adapter.height + 2*paddingPx + 2* borderPx + 'px')
			container.css('height', adapter.height + 3 + 2*paddingPx + 2* borderPx + 'px')
		}
	}

	this.destroy = function() {
		textarea.off()
		drag.detach()
		container.remove()
		adapter = null
		that = null
	}
}