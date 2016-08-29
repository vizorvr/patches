/**
 * helper data preprocessor Handlebars rendering. see pagination.handlebars
 * @param perPage number of results on page
 * @param totalPages number of total pages
 * @param currentPage current page
 * @param totalCount number of results in total
 * @param maxPageLinks maximum number of pages to display e.g. 5  =   4, 5, [6], 7, 8
 * @constructor
 */
var Pagination = function (perPage, totalPages, currentPage, totalCount, baseUrl, maxPageLinks) {
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
	Object.defineProperties(this, {
		pages: {
			get: () => (pages) ? pages : (pages = that.getPages()),
			set: v => {pages = v}	// allow resetting
		},
		displayPages: {
			get: () => that.getDisplayPages()
		},
		// currentPage starts from 1, (pages[] is 0-based)
		prevPage : {
			get: () => (that.currentPage >= 2) ? this.pages[that.currentPage-2] : null
		},
		nextPage : {
			get: () => (that.currentPage < this.pages.length) ? this.pages[that.currentPage] : null
		},
		firstPage : {
			get: () => this.pages[0]
		},
		lastPage : {
			get: () => this.pages.slice(-1)[0]
		},
		firstDisplayPage : {
			get: () => this.displayPages[0]
		},
		lastDisplayPage : {
			get: () => this.displayPages.slice(-1)[0]
		},
		thisPage : {
			get: () => this.pages[that.currentPage-1]
		},
		shouldDisplayFirstPageLink : {
			get: () => (this.pages.length && (this.firstDisplayPage.num - this.firstPage.num > 0))
		},
		shouldDisplayLastPageLink : {
			get: () => (this.pages.length && (this.lastPage.num - this.lastDisplayPage.num > 0))
		},
		shouldDisplayFirstPageEllipsis : {
			get: () => (this.pages.length && (this.firstDisplayPage.num - this.firstPage.num > 1))
		},
		shouldDisplayLastPageEllipsis : {
			get: () => (this.pages.length && (this.lastPage.num - this.lastDisplayPage.num > 1))
		}
	})
}

/**
 * create an instance from list.meta as returned by assetService
 * @param meta
 * @returns {Pagination}
 */
Pagination.fromMeta = function(meta) {
	var totalCount = meta.totalCount
	var limit = meta.limit || 0
	var totalPages = 0
	var currentPage = meta.page || 0

	if (limit) {
		totalPages = Math.ceil(totalCount / limit)
		if (!currentPage) { // calculate page number from offset
			currentPage = 1 + meta.offset / limit
		}
	}
	return new Pagination(limit, totalPages, currentPage, meta.totalCount, meta.baseUrl)
}

Pagination.prototype = Object.create({})
Pagination.prototype.constructor = Pagination

/**
 * produces an array containing link parameters for all pages in this pagination
 * @returns {Array}
 */
Pagination.prototype.getPages = function() {
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

Pagination.prototype.getDisplayPages = function() {
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

if ((typeof module !== 'undefined') && module.exports) {
	module.exports = Pagination
}