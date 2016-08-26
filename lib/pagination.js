/**
 * helper data preprocessor Handlebars rendering. see pagination.handlebars
 * @param perPage number of results on page
 * @param totalPages number of total pages
 * @param currentPage current page
 * @param totalCount number of results in total
 * @param maxPageLinks maximum number of pages to display e.g. 5  =   4, 5, [6], 7, 8
 * @constructor
 */
var Pagination = function (perPage, totalPages, currentPage, totalCount, maxPageLinks) {
	this.totalPages = totalPages
	this.perPage = perPage
	this.currentPage = currentPage
	this.totalCount = totalCount
	this.maxPageLinks = maxPageLinks || 9

	var that = this

	if (perPage > 0) {
		this.thisPageCount = perPage
		if (currentPage === totalPages)
			this.thisPageCount = totalCount % perPage
	} else {
		this.thisPageCount = 0
		this.totalPages = 0
	}

	var pages = null
	Object.defineProperties(this, {
		pages: {
			get: () => (pages) ? pages : (pages = that.getPages()),
			set: v => {pages = v}	// allow resetting
		},
		displayPages: {
			get: () => {
				var pages = this.pages
				var max = that.maxPageLinks

				if ((max === 0) || (max >= pages.length))
					return pages

				// center is selected page
				var current = that.currentPage - 1
				var start = current
				var end = current+1
				var preferEnd = true
				while (end - start < max) {
					if (preferEnd) {
						if (end < pages.length) end++
						else if (start > 0) start--
					} else {
						if (start > 0) start--
						else if (end < pages.length) end++
					}
					preferEnd = !preferEnd
				}

				return pages.slice(start, end)
			}
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
		thisPage : {
			get: () => this.pages[that.currentPage-1]
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
	return new Pagination(limit, totalPages, currentPage, meta.totalCount)
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

if ((typeof module !== 'undefined') && module.exports) {
	module.exports = Pagination
}