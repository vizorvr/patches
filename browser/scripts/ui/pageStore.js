if (typeof VizorUI === 'undefined')
	var VizorUI = {}

/**
 * makes a store from obj
 * aim: get us through until universal ES6 Proxy support
 * writing to obj props results in events dispatched on document
 * writing to obj.prop 		=> ('changed:objClass', {id, key:prop, value:v})
 * writing to obj.o.prop 	=> ('changed:objClass', {id, key:o.prop, value:v})
 * writing v{} to obj.o will convert v to substore
 * overwriting obj.prop with another {} preserves this functionality
 * limitations: adding new props to obj will not create setters and/or getters
 * 				deleting obj props will not emit events
 * @param obj
 * @param objClass e.g. graph,profile,etc - used to name events e.g. changed:graph
 * @param objId id/uniq of object
 */
VizorUI.makeStore = function (obj, objClass, objId) {

	if (typeof obj !== 'object') {
		console.warn('obj is not object')
		return obj
	}

	var changed = function(className, k, v) {
		// emit changed:objClass, objId, k, v
		// e.g. changed:graph, {id: '5abc723781273', class: 'graph', key: 'stats.views', value: 4
		// e.g. changed:graph, 5abc723781273, name, "boza"
		var detail = {
			id: objId,
			class: className,
			key: k,
			value: v
		}
		var e = new CustomEvent('changed:'+className, {detail:detail})
		document.dispatchEvent(e)
	}

	var makeObj = function(o, className, id, stack) {
		var store = {}

		var etters = function(key, className) {
			stack.push(key)

			var stackCopy = []
			stack.forEach(function(v){stackCopy.push(v)})

			var propFQN = stackCopy.join(".")
			if ((typeof o[key] === 'object') && o[key] && !o[key].__store__) {
				// getters and setters for the whole object
				o[key] = makeObj(o[key], className, id, stackCopy)
			}

			// regular getters and setters
			Object.defineProperty(store, key, {
				get: function () {
					return o[key]
				},
				set: function (v) {
					var change = (o[key] !== v)

					if (typeof v === 'object')
						o[key] = makeObj(v, className, id, stackCopy)
					else
						o[key] = v

					if (change)
						changed(className, propFQN, o[key])

					return v
				},
				enumerable: true,
				configurable: true
			})
			stack.pop()
		}

		Object.keys(o).forEach(function (key) {
			etters(key, className)
		})
		return store
	}

	// obj holds the original data for store
	// writing to store writes to obj, and emits an event as described
	var store = makeObj(obj, objClass, objId, [])
	store.__store__ = true

	return store
}


/**
 * turns objects in window.Vizor.pageObjects {profiles[], graphs[]} into stores that emit events when any of their properties change
 * also turns window.Vizor.pageObjects into a store
 */
VizorUI.pageStore = function() {
	var page = Vizor.pageObjects
	if (!page)
		return

	function make(collection, className) {
		Object.keys(collection).forEach(function(k){
			collection[k] = VizorUI.makeStore(collection[k], className, k) })
	}

	if (page.profiles)
		make(page.profiles, 'profile')

	if (page.graphs)
		make(page.graphs, 'graph')

	make(page, 'pageObjects')

	// convenience methods
	page.getGraph = function(id) {
		return page.graphs[id]
	}
	page.getProfile = function(id) {
		return page.profiles[id]
	}
	page.getGraphOwnerProfile = function(graphId) {
		var g = page.graphs[graphId]
		if (!g)
			return console.error('graph id '+graphId +' not found on page')

		return page.profiles[g._creator]
	}
	page.deleteGraph = function(graphId) {
		var graph = page.getGraph(graphId)
		if (!graph)
			return

		var graphOwner = page.getGraphOwnerProfile(graphId)
		delete(page.graphs[graphId])
		if (graphOwner)
			--graphOwner.stats.projects
	}

}


if (typeof(module) !== 'undefined') {
	module.exports = {
		pageStore : VizorUI.pageStore,
		makeStore : VizorUI.makeStore
	}
} else {
	document.addEventListener('DOMContentLoaded', VizorUI.pageStore)
}