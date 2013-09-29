#!/usr/bin/env python
from __future__ import print_function
import os
import sys
import codecs
import json
import fnmatch
import shlex

ANSI_BLUE = '\033[94m'
ANSI_GREEN = '\033[92m'
ANSI_YELLOW = '\033[93m'
ANSI_RED = '\033[91m'
ANSI_PROMPT = '\033[95m'
ANSI_ENDC = '\033[0m'

help_txt = """
The following commands are available:
-------------------------------------

* Where """ + ANSI_GREEN + """<sel>""" + ANSI_ENDC + """ is specified, this means: wildcard pattern
or id <n>, where <n> is the uid of the desired object.

* Where """ + ANSI_GREEN + """-gnc""" + ANSI_ENDC + """ flags can be supplied these limit the operation 
to (g)raphs, (n)odes or (c)onnections. Any combination can be
specified, ex.: -gc, -gn and so on. The default is to operatate
on all three.

-------------------------------------

""" + ANSI_GREEN + """cd <sel | ..>""" + ANSI_ENDC + """:
Moves up to the parent graph or into the first child graph
matching the name pattern or uid supplied.

""" + ANSI_GREEN + """ls [-gnc] [sel]""" + ANSI_ENDC + """:
List the contents of the current graph. If no selector is given,
everything is listed.

""" + ANSI_GREEN + """rm [-gnc] <sel>""" + ANSI_ENDC + """:
Removes the specified items from the current graph. Will display
the pending set and ask for confirmation before proceeding.

""" + ANSI_GREEN + """(d)ump [-gnc] [sel]""" + ANSI_ENDC + """:
Dumps the json of the matching objects.

""" + ANSI_GREEN + """(r)efac [-gnc] <property name> <old value> <new value> <sel>""" + ANSI_ENDC + """:
Dumps the json of the matching objects.
"""

if len(sys.argv) < 2:
	sys.exit('Usage: edit-graph.py <graph.json>')

with codecs.open(sys.argv[1], 'r', 'utf-8-sig') as json_data:
	data = json.load(json_data)

print('Loaded ' + sys.argv[1])

class Connection:
	def __init__(self, parent_graph, data):
		self.parent_graph = parent_graph
		self.data = data
		self.index = parent_graph.conn_index
		parent_graph.conn_index = parent_graph.conn_index + 1
		self.src_node = parent_graph.find_node_by_uid(data['src_nuid'])
		self.dst_node = parent_graph.find_node_by_uid(data['dst_nuid'])
		self.desc = '[%d] %s (%d) -> %s (%d)' % (self.index, self.src_node.title, self.src_node.uid, self.dst_node.title, self.dst_node.uid)

class Node:
	def __init__(self, parent_graph, data):
		self.parent_graph = parent_graph
		self.uid = data['uid']
		self.title = data.get('title') or data['plugin']
		self.data = data
		self.plugin = data['plugin']
		
		if self.plugin == 'graph' or self.plugin == 'loop':
			self.graph = Graph(data['title'], parent_graph, self, data['graph'])
	
	def get_conns(self):
		conns = []
		
		for conn in self.parent_graph.conns:
			if conn.src_node == self or conn.dst_node == self:
				conns.append(conn)
		
		return conns

class Graph:
	def __init__(self, name, parent_graph, parent_node, data):
		self.name = name
		self.parent_graph = parent_graph
		self.parent_node = parent_node
		self.uid = -1
		self.nodes = []
		self.all_nodes = []
		self.conns = []
		self.graphs = []
		self.data = data
		self.conn_index = 0
		
		if data:
			self.uid = data['uid']
			
			for n in data['nodes']:
				node = Node(self, n)
			
				if hasattr(node, 'graph'):
					self.graphs.append(node.graph)
				else:
					self.nodes.append(node)
			
				self.all_nodes.append(node)
			
			for c in data['conns']:
				conn = Connection(self, c)
			
				self.conns.append(conn)
	
	def parse_by_id(self, pat):
		t = shlex.split(pat)
		is_digit = len(t) > 1 and t[1].isdigit()
		
		return t[0] == 'id' and is_digit, int(t[1]) if is_digit else -1
	
	def remove_dyn_slot(self, is_output, uid):
		dslots = self.parent_node.data['dyn_out'] if is_output else self.parent_node.data['dyn_in']
		
		for slot in dslots:
			if slot['uid'] == uid:
				print('Removed slot ' + slot.uid)
				dslots.remove(slot)
				break
	
	def delete(self, graph):
		for g in graph.graphs:
			self.delete_graph(g)

		for n in graph.nodes:
			self.delete_node(n)
			
		for c in graph.conns:
			self.delete_conn(c)

	def delete_node(self, node):
		if node in self.nodes: self.nodes.remove(node)
		if node in self.all_nodes: self.all_nodes.remove(node)

		nodes = self.data['nodes']

		if node.data in nodes: nodes.remove(node.data)
		
		if hasattr(self.parent_graph, 'parent_node'):
			if node.plugin == 'input_proxy':
				self.parent_graph.parent_node.remove_dyn_slot(False, self.data['state']['slot_id'])
			elif node.plugin == 'output_proxy':
				self.parent_graph.parent_node.remove_dyn_slot(True, self.data['state']['slot_id'])
				
	def delete_conn(self, conn):
		if conn in self.conns: self.conns.remove(conn)
		
		conns = self.data['conns']
		
		if conn.data in conns: conns.remove(conn.data)

	def delete_graph(self, graph):
		if graph in self.graphs: self.graphs.remove(graph)
		
		self.delete_node(graph.parent_node)

	def find_node_by_uid(self, uid):
		for node in self.all_nodes:
			if node.uid == uid:
				return node
	
	def find_all(self, pat, mask = [True, True, True]):
		g = Graph('Internal search graph', None, None, None)
		
		g.graphs = self.find_graphs(pat) if mask[0] else [];
		g.nodes = self.find_nodes(pat) if mask[1] else [];
		g.conns = self.find_conns(pat) if mask[2] else [];
		
		return g
		
	def find_nodes(self, pat):
		results = []
		by_id, uid = self.parse_by_id(pat)
		
		for node in self.nodes:
			if by_id:
				if node.uid == uid:
					results.append(node)
			elif fnmatch.fnmatch(node.title, pat):
				results.append(node)
		
		return results

	def find_conns(self, pat):
		results = []
		by_id, idx = self.parse_by_id(pat)
		
		for conn in self.conns:
			if by_id:
				if conn.index == idx:
					results.append(conn)
			elif fnmatch.fnmatch(conn.desc, pat):
				results.append(conn)
		
		return results
	
	def find_graphs(self, pat):
		results = []
		by_id, uid = self.parse_by_id(pat)
		
		for graph in self.graphs:
			if by_id:
				if graph.uid == uid:
					results.append(graph)
			elif fnmatch.fnmatch(graph.name, pat):
				results.append(graph)
		
		return results

	def find_graph_by_uid(self, uid):
		for graph in self.graphs:
			if graph.uid == uid:
				return graph
	
	def echo(self, cbs = [None, None, None]):
		for graph in self.graphs:
			print(ANSI_GREEN + '<GRAPH> ' + ANSI_ENDC + graph.name + ' (' + str(graph.uid) + ')')
			if cbs[0]: cbs[0](graph)

		for node in self.nodes:
			print(ANSI_BLUE + '<NODE> ' + ANSI_ENDC + node.title + ' (' + str(node.uid) + ')')
			if cbs[1]: cbs[1](node)

		for conn in self.conns:
			print(ANSI_YELLOW + '<CONN> ' + ANSI_ENDC + conn.desc)
			if cbs[2]: cbs[2](conn)
		
	def dump(self, pat, mask, cbs):
		g = self.find_all(pat, mask)
		g.echo(cbs)
		return [len(g.graphs), len(g.nodes), len(g.conns)]
	
	def iterate(self, cbs = [None, None, None], mask = [True, True, True]):
		array = [self.graphs, self.nodes, self.conns]
		
		for i in range(3):
			if not mask[i] or not cbs[i]:
				continue
			
			cb = cbs[i]
			
			for item in array[i]:
				cb(item)
		
class Context:
	def __init__(self, data, filename):
		self.data = data
		self.filename = filename
		self.root_graph = Graph('Root', None, None, data['root'])
		self.current_graph = self.root_graph
		self.cwd = 'Root/'
		
	def build_path_recursive(self, path, graph):
		path = graph.name + '/' + path
		
		if graph.parent_graph:
			return self.build_path_recursive(path, graph.parent_graph)
		
		return path
			
	def update_cwd(self):
		self.cwd = self.build_path_recursive('', self.current_graph)		
	
	def cd(self, args):
		if not args: return
		
		if args[0] == '..':
			if self.current_graph.parent_graph == None:
				return 'You\'re already in the root.'
			else:
				self.current_graph = self.current_graph.parent_graph
				self.update_cwd()
		else:
			name = ' '.join(args)
			graphs = self.current_graph.find_graphs(name)
			
			if len(graphs) < 1:
				return 'No such graph: ' + name
			
			if len(graphs) > 1:
				msg = 'The specified graph \'' + name + '\' is named ambigously. Which graph did you mean:\n'
				
				for graph in graphs:
					msg = msg + ('\n%s<GRAPH> %s (%d) %s' % (ANSI_GREEN, ANSI_ENDC, graph.uid, graph.name))
					
				return msg

			self.current_graph = graphs[0]
			self.update_cwd()
		
	def parse_pattern(self, args):
		pat = '*'
		mask = [ False, False, False ]
		
		if len(args) > 0:
			if args[0][0] == '-':
				for c in args[0][1:]:
					if c == 'g':
						mask[0] = True
					elif c == 'n':
						mask[1] = True
					elif c == 'c':
						mask[2] = True
					else:
						return 'Unrecognized switch ' + args[0]
			else:
				pat = ' '.join(args)
			
			if len(args) > 1:
				pat = ' '.join(args[1:])

		if not mask[0]	and not mask[1] and not mask[2]:
			mask = [True, True, True]
		
		return pat, mask
		
	def print_summary(self, count):
		print('\n%d graphs, %d nodes and %d connections.' % (count[0], count[1], count[2]))
	
	def ls(self, args):
		pat, mask = self.parse_pattern(args)
		
		self.print_summary(self.current_graph.dump(pat, mask, [None, None, None]))
	
	def rm(self, args):
		if len(args) < 1:
			return 'Nothing to remove.'
		
		pat, mask = self.parse_pattern(args)
		g = self.current_graph.find_all(pat, mask)
		
		if mask[1]:
			for node in g.nodes:
				g.conns.extend(node.get_conns())
		
		g.conns = list(set(g.conns))
		pending = len(g.graphs) + len(g.nodes) + len(g.conns)
		
		if pending > 0:
			print('\n' + ANSI_RED + 'This action will delete the following objects:\n' + ANSI_ENDC)
			
			g.echo()
			
			answer = raw_input('\nThis operation will destroy data. Continue (y/n)? ')
			
			if answer == 'yes' or answer == 'y':
				self.current_graph.delete(g)
				print('\nRemoved %d graphs, %d nodes and %d connections.' % (len(g.graphs), len(g.nodes), len(g.conns)))
		else:
			return 'Nothing to remove.'
	
	def dump(self, args):
		pat, mask = self.parse_pattern(args)
		
		def dump_json(i): print(json.dumps(i.data, indent = 2, sort_keys = False) + '\n')
		
		self.print_summary(self.current_graph.dump(pat, mask, [dump_json, dump_json, dump_json]))
	
	def refac(self, args):
		pat, mask = self.parse_pattern(args)
		tok = shlex.split(pat)
		
		if len(tok) < 4:
			return 'Missing argument(s).'
		
		print(pat, mask)
		prop = tok[0]
		old_val = tok[1]
		new_val = tok[2]
		pat = tok[3]
		
		#def ex_prop(i):
		#	if hasattr(i, prop) and i[prop] == old_val: i[prop] = new_value
		
		def ex_prop(i):
			print(prop, type(i.data[prop]), i.data[prop])

		self.current_graph.find_all(pat).iterate([ex_prop, ex_prop, ex_prop], mask)

	def save(self, args):
		f = open(self.filename, 'w')
		
		# TODO: The ordering of the keys is not maintained!
		f.write(json.dumps(self.data, indent=4, sort_keys=False))
		f.close()
		
		print('Saved to ' + self.filename)

context = Context(data, sys.argv[1])
	
def parse(cmd):
	if cmd == "":
		return None
	
	t = shlex.split(cmd)
	args = t[1:]
	
	if t[0] == 'cd':
		return context.cd(args)
	elif t[0] == 'ls':
		return context.ls(args)
	elif t[0] == 'rm':
		return context.rm(args)
	elif t[0] == 'dump' or t[0] == 'd':
		return context.dump(args)
	elif t[0] == 'refac' or t[0] == 'r':
		return context.refac(args)
	elif t[0] == 'save' or t[0] == 's':
		return context.save(args)
	elif t[0] == 'help' or t[0] == 'h' or t[0] == '?':
		print(help_txt)
	elif t[0] == 'exit' or t[0] == 'quit' or  t[0] == 'e'  or t[0] == 'q':
		sys.exit('Session closed.')
	else:
		print('Unrecognized command: ' + t[0])

def repl():
    while True:
        val = parse(raw_input('\n' + ANSI_PROMPT + context.cwd + '>' + ANSI_ENDC + ' '))
	
        if val is not None:
		print(str(val))

repl()
