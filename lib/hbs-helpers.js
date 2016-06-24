if ((typeof module !== 'undefined') && module.exports) {
	var Handlebars = require('handlebars')
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

    json : function(context) {
        return JSON.stringify(context)
    },

    formatDate : function(date) {
		var mdate = moment(date)
		var now = moment(Date.now())

		if (mdate.isSame(now, 'd'))
			return moment(date).calendar()

		if (mdate.isSame(now, 'y'))
			return moment(date).format('MMM Do h:mm A')

		return moment(date).format('ll h:mm A')
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
		if (arg instanceof Array)
			return arg.length
		if (typeof arg === 'object')
			return arg.keys.length
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
		return (typeof arg === 'object') ? (Object.keys(arg).length > 0) : !!arg
	},

	// returns arg&&arg&&arg&&arg
	and: function() {
		var result = true
		return arguments.slice(0,-1)
			.reduce(function(arg){return result && helpers.have(arg)})
	},

	// returns arg||arg||arg||arg
	or: function() {
		var result = false
		return arguments.slice(0,-1)
			.reduce(function(arg){return result || helpers.have(arg)})
	}
}

if ((typeof module !== 'undefined') && module.exports)
	module.exports = helpers

if ((typeof window !== 'undefined') && window.Handlebars) {
	Object.keys(helpers).forEach(function(name) {
		window.Handlebars.registerHelper(name, helpers[name])
	})
}

