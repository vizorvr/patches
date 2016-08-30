/**
 * helper data preprocessor Handlebars rendering. see pagination.handlebars
 * @param perPage number of results on page
 * @param totalPages number of total pages
 * @param currentPage current page
 * @param totalCount number of results in total
 * @param maxPageLinks maximum number of pages to display e.g. 5  =   4, 5, [6], 7, 8
 * @constructor
 */
var UIPagination = function (perPage, totalPages, currentPage, totalCount, baseUrl, maxPageLinks) {
	this.totalPages = totalPages
	this.perPage = perPage
	this.currentPage = currentPage
	this.totalCount = totalCount
	this.maxPageLinks = maxPageLinks || 3
	this.baseUrl = baseUrl || false

	var that = this

	if (perPage > 0) {
		this.thisPageCount = perPage
		if (currentPage === totalPages)
			this.thisPageCount = totalCount % perPage
	} else {
		this.thisPageCount = 0
		this.totalPages = 0
	}

	var pages = null		/* num, start, displayStart, displayEnd */
	Object.defineProperties(this, {	// Safari 9.1- has no arrow functions
		pages: {
			get: function() {return (pages) ? pages : (pages = that.getPages())},
			set: function(v) {return pages = v}	// allow resetting
		},
		displayPages: {
			get: function() {return that.getDisplayPages()}
		},
		// currentPage starts from 1, (pages[] is 0-based)
		prevPage : {
			get: function() {return (that.currentPage >= 2) ? this.pages[that.currentPage-2] : null }
		},
		nextPage : {
			get: function() {return (that.currentPage < this.pages.length) ? this.pages[that.currentPage] : null }
		},
		firstPage : {
			get: function() {return this.pages[0] }
		},
		lastPage : {
			get: function() {return this.pages.slice(-1)[0] }
		},
		firstDisplayPage : {
			get: function() {return this.displayPages[0] }
		},
		lastDisplayPage : {
			get: function() {return this.displayPages.slice(-1)[0] }
		},
		thisPage : {
			get: function() {return this.pages[that.currentPage-1] }
		},
		shouldDisplayFirstPageLink : {
			get: function() {return (this.pages.length && (this.firstDisplayPage.num - this.firstPage.num > 0)) }
		},
		shouldDisplayLastPageLink : {
			get: function() {return (this.pages.length && (this.lastPage.num - this.lastDisplayPage.num > 0)) }
		},
		shouldDisplayFirstPageEllipsis : {
			get: function() {return (this.pages.length && (this.firstDisplayPage.num - this.firstPage.num > 1)) }
		},
		shouldDisplayLastPageEllipsis : {
			get: function() {return (this.pages.length && (this.lastPage.num - this.lastDisplayPage.num > 1)) }
		}
	})
}

/**
 * create an instance from list.meta as returned by assetService
 * @param meta {totalCount, limit, offset, (page, baseUrl)}
 * @returns {UIPagination}
 */
UIPagination.fromMeta = function(meta) {
	var totalCount = meta.totalCount
	var limit = meta.limit || 0
	var totalPages = 0
	var currentPage = meta.page || 0

	if (limit) {
		totalPages = Math.ceil(totalCount / limit)
		if (!currentPage) { // calculate page number from offset
			currentPage = Math.floor(1 + meta.offset / limit)
		}
	}
	return new UIPagination(limit, totalPages, currentPage, meta.totalCount, meta.baseUrl)
}

UIPagination.prototype = Object.create({})
UIPagination.prototype.constructor = UIPagination

/**
 * produces an array containing link parameters for all pages in this pagination
 * @returns {Array}
 */
UIPagination.prototype.getPages = function() {
	var ret = []
	var perPage = this.perPage
	if (!perPage)
		return ret

	var totalCount = this.totalCount
	var num, start, end
	for (var i = 0; i < this.totalPages; i++) {
		num = i + 1
		start = i * perPage
		end = (i+1) * perPage
		if (totalCount && end > totalCount)
			end = totalCount

		ret.push({
			num : num,
			start : start,
			displayStart : 1+start,
			displayEnd: end
		})
	}
	return ret
}

UIPagination.prototype.getDisplayPages = function() {
	var pages = this.pages
	var max = this.maxPageLinks

	if ((max === 0) || (max >= pages.length))
		return pages

	// centre is selected page
	var current = this.currentPage - 1
	var start = current
	var end = current+1
	var fromEnd = true
	while (end - start < max) {
		if (fromEnd) {
			if (end < pages.length) end++
			else if (start > 0) start--
		} else {
			if (start > 0) start--
			else if (end < pages.length) end++
		}
		fromEnd = !fromEnd
	}

	return pages.slice(start, end)
}

UIPagination.readContainer = function(el) {
	var d = el.dataset
	return {
		control: el,
		totalCount: parseInt(d.totalcount),
		thisPageCount: parseInt(d.thispagecount),
		totalPages : parseInt(d.totalpages),
		perPage : parseInt(d.perpage),
		currentPage: parseInt(d.currentpage),
		baseUrl: d.baseurl
	}
}

/**
 * loads href from nextLink, passing the loaded content to callback function
 * @param paginationContainer HTMLElement DOM node
 * @param cb function callback
 */
UIPagination.bindNextLink = function(paginationContainer, cb) {
	if (!paginationContainer)
		return // nothing to listen for

	var nextLink = paginationContainer.querySelector('a.page.next')
	if (!(nextLink && nextLink.href))
		return true

	if (!document.body.dataset.originalTitle) {
		document.body.dataset.originalTitle = document.title
		document.body.dataset.previousTitle = document.title
		document.body.dataset.originalUrl = window.location.href
		document.body.dataset.previousUrl = window.location.href
	}


	function loadNext(e) {
		var classes = paginationContainer.classList
		if (classes.contains('loading') || classes.contains('loaded') || classes.contains('error'))
			return true

		e.preventDefault()
		e.stopPropagation()

		var scroll = {x: window.scrollX, y: window.scrollY}		// current scrollX/Y
		var screen = {width: window.innerWidth, height: window.innerHeight}		// includes scrollbars but that's OK
		var rect = paginationContainer.getBoundingClientRect()	// monitored pagination container

		// should hit link
		classes.add('loading')
		var url = nextLink.href
		var nextPageNum = nextLink.dataset.num

		document.body.dataset.previousUrl = window.location.href

		$.get(url)
			.success(function(response){

				classes.remove('loading')
				classes.add('loaded')

				// http://stackoverflow.com/a/27692636
				// http://stackoverflow.com/a/15261800

				window.history.replaceState({}, document.title, url)

				var title = document.body.dataset.originalTitle + ' (page '+nextPageNum + ')'
				try {
					document.getElementsByTagName('title')[0].innerHTML = title.replace('<','&lt;').replace('>','&gt;').replace(' & ',' &amp; ')
				}
				catch (e) {}
				document.title = title


				// window.history.replaceState({}, document.body.dataset.originalTitle, url)


				// document.body.dataset.previousTitle = _title
				if (cb) {
					var oldData = UIPagination.readContainer(paginationContainer)
					cb(response, paginationContainer, {scroll:scroll, viewport:screen, containerRect: rect})
				}
			})
			.fail(function(err){
				classes.remove('loading')
				classes.add('error')
				console.error(err)
			})
	}

	nextLink.addEventListener('click', loadNext)
	nextLink.dataset.xhrenabled = true

}

/**
 * handles pagination coming into view and hits the next link automatically if its data-xhrenabled is set to true
 */
UIPagination.listen = function(paginationContainer) {

	if (UIPagination._resetListener)
		UIPagination._resetListener()

	if (!paginationContainer)
		return // nothing to listen for

	function handler(e) {
		var nextLink = paginationContainer.querySelector('a.page.next')
		if (!(nextLink && nextLink.href))
			return true

		var rect = paginationContainer.getBoundingClientRect()	// monitored pagination container

		if (!nextLink.dataset.xhrenabled)	// !
			return true

		if (rect.top < window.innerHeight) {	// includes scrollbars but that's OK

			var evt = new MouseEvent('click', {
				view: window,
				bubbles: true,
				cancelable: true,
				clientX: 5
			})
			nextLink.dispatchEvent(evt)
		}
		return true
	}

	// throttles and calls the handler if it's time
	var oldTimeStamp = 0
	var _t
	function listener(e) {
		// throttle this
		clearTimeout(_t)
		if (e.timeStamp - oldTimeStamp < 200) {
			_t = setTimeout(function () {
				handler.call(this, e)
			}.bind(this), 100)
			return
		}
		oldTimeStamp = e.timeStamp
		handler(e)
	}

	var _listener = listener.bind(this)
	window.addEventListener('scroll', _listener)
	window.addEventListener('resize', _listener)

	UIPagination._resetListener = function() {
		window.removeEventListener('resize', _listener)
		window.removeEventListener('scroll', _listener)
		UIPagination._resetListener = null
	}

	_listener({timeStamp: new Date().getTime()})

}

if ((typeof module !== 'undefined') && module.exports) {
	module.exports = UIPagination
}