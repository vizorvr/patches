#!/usr/bin/env python
from __future__ import print_function
import os
import sys
import codecs
import json
import fnmatch

ANSI_BLUE = '\033[94m'
ANSI_GREEN = '\033[92m'
ANSI_YELLOW = '\033[93m'
ANSI_ENDC = '\033[0m'

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
		self.uid = data['uid']
		self.nodes = []
		self.all_nodes = []
		self.conns = []
		self.graphs = []
		self.data = data
		self.conn_index = 0
		
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
	
	def find_node_by_uid(self, uid):
		for node in self.all_nodes:
			if node.uid == uid:
				return node
	
	def parse_by_id(self, pat):
		t = pat.split(' ')
		is_digit = len(t) > 1 and t[1].isdigit()
		
		return t[0] == 'id' and is_digit, int(t[1]) if is_digit else -1
	
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
	
	def dump_nodes(self, pat, cb):
		count = 0
		
		for node in self.find_nodes(pat):
			print(ANSI_BLUE + '<NODE> ' + ANSI_ENDC + node.title + ' (' + str(node.uid) + ')')
			
			if cb:
				cb(node)
			
			count = count + 1
		
		return count
		
	def dump_conns(self, pat, cb):
		count = 0
		
		for conn in self.find_conns(pat):
			print(ANSI_YELLOW + '<CONN> ' + ANSI_ENDC + conn.desc)
			
			if cb:
				cb(conn)
				
			count = count + 1
		
		return count
	
	def dump_graphs(self, pat, cb):
		count = 0
		
		for graph in self.find_graphs(pat):
			print(ANSI_GREEN + '<GRAPH> ' + ANSI_ENDC + graph.name + ' (' + str(graph.uid) + ')')
			
			if cb:
				cb(graph)
				
			count = count + 1
		
		return count
		
class Context:
	def __init__(self, data):
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
				pat = args[-1]
			
			if len(args) > 1:
				pat = args[-1]

		if not mask[0]	and not mask[1] and not mask[2]:
			mask = [True, True, True]
		
		return pat, mask
		
	def ls(self, args):
		pat, mask = self.parse_pattern(args)
		count = [0, 0, 0]
		
		if mask[0]:
			count[0] = self.current_graph.dump_graphs(pat, None)
		
		if mask[1]:
			count[1] = self.current_graph.dump_nodes(pat, None)
			
		if mask[2]:
			count[2] = self.current_graph.dump_conns(pat, None)
			
		print('\n%d graphs, %d nodes and %d connections.' % (count[0], count[1], count[2]))
	
	def rm(self, args):
		pat, mask = self.parse_pattern(args)
		graphs, nodes, conns = [], [], []
		
		if mask[0]:
			graphs = self.current_graph.find_graphs(pat)
		if mask[1]:
			nodes = self.current_graph.find_nodes(pat)
			
			for node in nodes:
				conns.extend(node.get_conns())
		if mask[2]:
			conns.extend(self.current_graph.find_conns(pat))
		
		conns = list(set(conns))
		
		print('\nRemoved %d graphs, %d nodes and %d connections.' % (len(graphs), len(nodes), len(conns)))

context = Context(data)
	
def parse(cmd):
	if cmd == "":
		return None
	
	t = cmd.split(' ')
	args = t[1:]
	
	if t[0] == 'cd':
		return context.cd(args)
	elif t[0] == 'ls':
		return context.ls(args)
	elif t[0] == 'rm':
		return context.rm(args)
	elif t[0] == 'dump' or t[0] == 'd':
		if len(t) < 2:
			return 'Dump what [(g)raph, (n)ode or (c)onn]?'
		
		if t[1] == 'graph' or t[1] == 'g':
			if len(t) < 3:
				return 'Dump what graph(s)?'
			
			context.dump_graphs(' '.join(t[2:]), lambda graph: print(json.dumps(graph.data, indent=2, sort_keys=True) + '\n'))
		elif t[1] == 'node' or t[1] == 'n':
			if len(t) < 3:
				return 'Dump what node(s)?'
			
			context.dump_nodes(' '.join(t[2:]), lambda node: print(json.dumps(node.data, indent=2, sort_keys=True) + '\n'))
		elif t[1] == 'conn' or t[1] == 'c':
			if len(t) < 3:
				return 'Dump what connections(s)?'
			
			context.dump_conns(' '.join(t[2:]), lambda conn: print(json.dumps(conn.data, indent=2, sort_keys=True) + '\n'))
		else:
			return 'Unknown object type: ' + t[1]
	elif t[0] == 'exit' or t[0] == 'quit' or  t[0] == 'e'  or t[0] == 'q':
		sys.exit('Session closed.')
	else:
		print('Unrecognized command: ' + t[0])

def repl():
    while True:
        val = parse(raw_input('\n' + context.cwd + '> '))
	
        if val is not None:
		print(str(val))

repl()
