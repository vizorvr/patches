/**
 * migration tools to use slot names instead of indices
 * in connections
 * 
 * this is a lib, the actual migration script is run.js
 */

var fs = require('fs')

var parsePluginSlots = require(__dirname+'/../../../lib/parsePluginSlots')

var slotMap = parsePluginSlots()

function migrateGraphFile(filename) {
	var presetSource = fs.readFileSync(filename)
	var preset = JSON.parse(presetSource)

	preset.root = migrateGraph(preset)

	fs.writeFileSync(filename, JSON.stringify(preset))
}

function migrateGraph(graph) {
	return migrateGraphToUseSlotNames(slotMap, graph.root)
}

function isGraphPlugin(pluginId) {
	return (['graph', 'loop', 'array_function'].indexOf(pluginId) > -1)
}

function getSlotName(slotNameMap, pluginId, slotType, index) {
	var pluginSlots = slotNameMap[pluginId + '.' + slotType]

	// this can happen for very old pre-THREE plugins
	if (!pluginSlots)
		return index

	return pluginSlots[index]
}

function migrateGraphToUseSlotNames(slotNameMap, graph) {
	var localUidToPluginId = {}

	graph.nodes.map(function(node) {
		localUidToPluginId[node.uid] = node.plugin

		if (isGraphPlugin(node.plugin))
			node.graph = migrateGraphToUseSlotNames(slotNameMap, node.graph)
		else
			return
	})

	graph.conns.map(function(conn) {
		var srcPluginId = localUidToPluginId[conn.src_nuid]
		var dstPluginId = localUidToPluginId[conn.dst_nuid]

		var srcSlotUid = conn.src_slot

		if (!conn.src_dyn && typeof(conn.src_slot) === 'number')
			srcSlotUid = getSlotName(slotNameMap, 
				srcPluginId, 1, conn.src_slot)

		var dstSlotUid = conn.dst_slot
		
		if (!conn.dst_dyn && typeof(conn.dst_slot) === 'number')
			dstSlotUid = getSlotName(slotNameMap, 
				dstPluginId, 0, conn.dst_slot)

		conn.src_slot = srcSlotUid
		conn.dst_slot = dstSlotUid
	})

	return graph
}

exports.migrateGraphToUseSlotNames = migrateGraphToUseSlotNames
exports.migrateGraphFile = migrateGraphFile
exports.migrateGraph = migrateGraph
