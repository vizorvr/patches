if ((typeof module !== 'undefined') && module.exports) {
	var _ = require('lodash')
	var Handlebars = require('handlebars')
	var path = require('path')
	var UIPagination = require(path.resolve( __dirname, '../browser/scripts/ui/pagination.js'))
}

var helpers = {
    /**
     * Check string or array for a length greater than a passed number
     * Usage: {{#ifLengthierThan activationsGraphData 5}} ... {{else}} ... {{/ifLengthierThan}}
     */
    ifLengthierThan: function(obj, length)
    {
        var options = arguments[arguments.length - 1];
        if(obj.length > length)
        {
            return options.fn(this);
        } else
        {
            return options.inverse(this);
        }
    },

	friendlyURL : function(url) {
		if (!url)
			return url

		url = url.replace(/.*?:\/\//g, "");
		if (url.endsWith('/'))
			url = url.substring(0, url.length-1);
		return url
	},

    json : function(obj, options) {
        var j = JSON.stringify(obj)
		if (!j)
			return j

		var deletes = options.hash['deleteKeys'] || ''
		if (deletes) {
			deletes.split(',')
				.forEach(function (d) {
					delete j[d.trim()]
				})
		}
		return j.replace(/<\//gm, '<\\\/') // escape html tag closers
    },

    formatDate : function(date) {
		var mdate = moment(date)
		var now = moment(Date.now())

		if (!mdate.isValid())
			return date
		
		if (mdate.isSame(now, 'd'))
			return mdate.calendar()

		if (mdate.isSame(now, 'y'))
			return mdate.format('MMM Do h:mm A')
		
		return mdate.format('ll h:mm A')
	},

    // e.g. 1 view, 2 views
    plural : function(count, what, whats) {
        var plural = (typeof whats === 'string') ? whats : what+'s'
        return count + ' ' + (count === 1  ? what : plural)
    },

    /**
     * Mark selected option based on passed in status
     * From: http://stackoverflow.com/questions/13046401/how-to-set-selected-select-option-in-handlebars-template#18349787
     * Usage:
     * <select>
     *   {{#select status}}
     *   <option>Option 1</option>
     *   <option>Option 2</option>
     *   <option value="Option 3">Option 3 (extra info)</option>
     *   <option value="Option 4">Option 4 (more extra)</option>
     *   {{/select}}
     * </select>
     */
    select: function(value, options)
    {
        return options.fn(this)
            .replace(new RegExp(' value=\"' + value + '\"'),
                '$& selected="selected"')
            .replace(new RegExp('>' + value + '</option>'),
                ' selected="selected"$&');
    },

	concat: function() {
		var i
		var ret = []
		var l = arguments.length - 1
		for (i=0; i<l; i++) {
			ret.push(arguments[i])
		}
		return ret.join("")
	},

	// e.g. (byindex templateVar string0 string1 string2 string3 ... stringN }
	byindex: function() {
		var opts = []
		for (var l=0; l<arguments.length; l++)
			opts.push(arguments[l])

		opts.pop()		// handlebars stuff

		var index = parseInt(0 + opts.shift())

		if (isNaN(index))
			return '?'
		return opts[index]
	},

	// e.g. (unescape 'something that would be "escaped" otherwise')
	unescape : function(content) {
		return new Handlebars.SafeString(content)
	},

	equals : function(arg1, arg2) {
		return arg1 === arg2
	},

	// length of array, or length of object keys, or length of (string) argument
	length : function(arg) {

		if (Array.isArray(arg))
			return arg.length
		if (typeof arg === 'object')
			return Object.keys(arg).length
		return (""+arg).length
	},

	moment: function(date, fmt) {	// use moment.js to format a date
		if (typeof moment !== 'undefined')
			return moment(date).format(fmt)
		// fallback
		return date.toString()
	},

	// returns true on arg being truthy.   [] {
	have : function(arg) {
		return (arg && typeof arg === 'object') ? (Object.keys(arg).length > 0) : !!arg
	},

	// returns arg&&arg&&arg&&arg
	and: function() {
		var result = true
		return Array.prototype.slice.call(arguments, 0,-1)
			.reduce(function(arg){return result && helpers.have(arg)})
	},

	// returns arg||arg||arg||arg
	or: function() {
		var result = false
		Array.prototype.slice.call(arguments, 0,-1)
			.map(function(arg){
				result = result || helpers.have(arg)
			})
		return !!result
	},

	/**** PAGINATION ****/

	/**
	 * parse .meta part of an assetService query result and define extra pagination variables
	 * @example hbs:  {{>pagination (makePaginationData list.meta)}}
	 * @param meta
	 * @returns {UIPagination}
	 */
	makePaginationData : function(meta) {	// used by graphList.handlebars
		return UIPagination.fromMeta(meta)
	},

	// gets the request.query from express or from current browser window
	_getQuery : function(queryString) {
		var query = {}

		// if running on client, and no queryString, default to the browser
		if ((typeof queryString === 'undefined') && (typeof window !== 'undefined') && (window.location))
			queryString = window.location.search

		if (queryString && queryString.length && queryString[0] === '?')
			queryString = queryString.substring(1)

		// if queryString found
		if (queryString) {
			for (var pair of queryString.split('&')) {
				pair = pair.split('=')
				if (typeof pair[1] === 'string')
					query[pair[0]] = decodeURIComponent(pair[1])
				else
					query[pair[0]] = pair[1]
			}
		}
		else {
			// assume running on backend
			if (Handlebars._request)	// see app.js
				query = _.extend(query, Handlebars._request.query)
		}
		return query
	},

	/**
	 * Replace parameters in the query string based on keys and values from passed object
	 * Use as Handlebars helper. To use a custom query string, pass '_' in opt.hash,
	 * @example hbs: {{{replaceQueryParameters k1=3 k2='val' k3=false k4=../var}}}
	 * @example hbs: {{{replaceQueryParameters _='?custom=querystring' k1=3 k2='val' k3=false k4=../var}}}
	 * @example  js: Handlebars.helpers.replaceQueryParameters({hash:{'qwe':4,'hexam':false}})
	 * @example  js: Handlebars.helpers.replaceQueryParameters({hash:{_:'?hexam=4&jolt', 'qwe':4,'hexam':false}})
	 * @param opt (Handlebars internal)
	 * @returns {string}
	 */
	replaceQueryParameters : function(opt) {
		var attributes = []

		var queryString = opt.hash['_']
		delete (opt.hash['_'])

		var query
		if ((typeof helpers !== 'undefined') && (helpers._getQuery))
			query = helpers._getQuery(queryString)
		else if (typeof Handlebars !== 'undefined')
			query = Handlebars.helpers._getQuery(queryString)

		if (!query)
			return '??'

		function isEmpty(value) {
			return (value === false) || (value === null) || (typeof value === 'undefined')
		}
		// clean empty variables from existing query
		for (var attributeName in opt.hash) {
			if (opt.hash.hasOwnProperty(attributeName)) {
				value = opt.hash[attributeName]
				if (isEmpty(value))
					delete query[attributeName]
				else
					query[attributeName] = value
			}
		}

		// join things back
		var ret=[], value
		for (var key of Object.keys(query)) {
			value = query[key]
			if (isEmpty(value))
				ret.push(key)
			else
				ret.push(key+'='+encodeURIComponent(query[key]))
		}
		return '?' + ret.join('&')
	}

	/**** END PAGINATION ****/
}

if ((typeof module !== 'undefined') && module.exports) {
	module.exports = helpers
}

if ((typeof window !== 'undefined') && window.Handlebars) {
	Object.keys(helpers).forEach(function(name) {
		window.Handlebars.registerHelper(name, helpers[name])
	})
}
