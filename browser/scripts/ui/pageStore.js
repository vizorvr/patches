if (typeof VizorUI === 'undefined')
	var VizorUI = {}

/**
 * makes a store from obj
 * aim: get us through until universal ES6 Proxy support
 * writing to obj props results in events dispatched on document
 * writing to obj.prop 		=> ('changed:obj', {prop, val})
 * writing to obj.o.prop 	=> ('changed:obj', {o.prop, val})
 * writing v{} to obj.o will convert v to substore
 * overwriting obj.prop with another {} preserves this functionality
 * limitation: adding props to obj will not create setters and/or getters
 * @param obj
 * @param objClass e.g. graph,profile,etc
 * @param objId id/uniq of object
 */
VizorUI.makeStore = function (obj, objClass, objId) {

	var f = {}
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
		console.info('changed:'+className, detail)
	}

	var makeObj = function(obj, className, id, stack) {
		var etters = function(key, className) {
			stack.push(key)

			var stackCopy = []
			stack.forEach(function(v){stackCopy.push(v)})

			var propFQN = stackCopy.join(".")
			if ((typeof _o[key] === 'object') && _o[key] && !_o[key].__store__) {
				// getters and setters for the whole object
				_o[key] = makeObj(_o[key], className, id, stackCopy)
			}

			// regular getters and setters
			Object.defineProperty(o, key, {
				get: function () {
					return _o[key]
				},
				set: function (v) {
					var change = (_o[key] !== v)

					if (typeof v === 'object')
						_o[key] = makeObj(v, className, id, stackCopy)
					else
						_o[key] = v

					if (change)
						changed(className, propFQN, _o[key])

					return v
				},
				enumerable: true,
				configurable: true
			})
			stack.pop()
		}

		var _o = obj
		var o = {}
		Object.keys(_o).forEach(function (key) {
			etters(key, className)
		})
		return o
	}

	var o = makeObj(obj, objClass, objId, [])
	o.__store__ = true

	return o
}


/**
 * turns objects in window.Vizor.page {profiles[], graphs[]} into stores that emit events when any of their properties change
 * also turns window.Vizor.page into a store
 */
VizorUI.pageStore = function() {
	var p = Vizor.page
	if (!p)
		return

	function make(collection, className) {
		Object.keys(collection).forEach(function(k){
			collection[k] = VizorUI.makeStore(collection[k], className, k) })
	}

	if (p.profiles)
		make(p.profiles, 'profile')

	if (p.graphs)
		make(p.graphs, 'graph')

	make(p, 'page')

	// convenience methods
	p.getGraph = function(id) {
		return p.graphs[id]
	}
	p.getProfile = function(id) {
		return p.profiles[id]
	}
	p.getGraphOwnerProfile = function(graphId) {
		var g = p.graphs[graphId]
		if (!g)
			return console.error('graph id '+graphId +' not found on page')

		return p.profiles[g._creator]
	}
	p.deleteGraph = function(graphId) {
		var graph = p.getGraph(graphId)
		if (!graph)
			return

		var graphOwner = p.getGraphOwnerProfile(graphId)
		delete(p.graphs[graphId])
		if (graphOwner)
			--graphOwner.stats.projects
	}

	console.info('pageStore()')
}

document.addEventListener('DOMContentLoaded', VizorUI.pageStore)