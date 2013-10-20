#!/usr/bin/env python
from __future__ import print_function
import os
import sys
import codecs
import json
import fnmatch
import shlex
import collections
import cmd

ANSI_BLUE = '\033[94m'
ANSI_GREEN = '\033[92m'
ANSI_YELLOW = '\033[93m'
ANSI_RED = '\033[91m'
ANSI_PROMPT = '\033[95m'
ANSI_ENDC = '\033[0m'

class DelegationException(Exception):
	pass

class ParsedSelectors:
	def __init__(self, args):
		self.pat = []
		self.predicate = [None] * 4
		self.mask = [False] * 4
		
		it = iter(args)

		for arg in it:
			if arg[0] == '-':
				for c in arg[1:]:
					if c == 'g':
						self.mask[0] = True
					elif c == 'n':
						self.mask[1] = True
					elif c == 'c':
						self.mask[2] = True
					elif c == 'r':
						self.mask[3] = True
					elif c == 'p':
						try:
							self.predicate = it.next()
						except StopIteration:
							print('*** Error: Expected predicate expression after the \'-p\' switch.')
							raise DelegationException()
					else:
						return '*** Error: Unrecognized switch ' + arg
			else:
				self.pat.append(arg)
		
		if len(self.pat) < 1:
			self.pat.append('*')

		if not self.mask[0] and not self.mask[1] and not self.mask[2]:
			self.mask[0] = self.mask[1] = self.mask[2] = True
		
		self.pat = ' '.join(self.pat)

class Connection:
	def __init__(self, parent_graph, data):
		self.parent_graph = parent_graph
		self.data = data
		self.uid = parent_graph.conn_index
		parent_graph.conn_index = parent_graph.conn_index + 1
		self.src_node = parent_graph.find_node_by_uid(data['src_nuid'])
		self.dst_node = parent_graph.find_node_by_uid(data['dst_nuid'])
		self.name = '%s (%d) -> %s (%d)' % (self.src_node.name, self.src_node.uid, self.dst_node.name, self.dst_node.uid)

class Node:
	def __init__(self, parent_graph, data):
		self.parent_graph = parent_graph
		self.uid = data['uid']
		self.name = data.get('title') or data['plugin']
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
		self.graphs = []
		self.nodes = []
		self.all_nodes = []
		self.conns = []
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
	
	def get_item_count(self):
		return len(self.graphs) + len(self.nodes) + len(self.conns)
	
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
		graph.iterate([self.delete_graph, self.delete_node, self.delete_conn])

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
	
	def find_all(self, ps, pred = [None, None, None]):
		g = Graph('Internal search graph', None, None, None)
		
		g.graphs = self.find_items('graphs', 0, ps, pred[0])
		g.nodes = self.find_items('nodes', 1, ps, pred[1])
		g.conns = self.find_items('conns', 2, ps, pred[2])
		
		return g
		
	def find_items(self, arr_prop, idx, ps, pred):
		if not ps.mask[idx]:
			return []
		
		by_id, uid = self.parse_by_id(ps.pat)
		
		return self.find_items_recursive(arr_prop, idx, by_id, uid, ps, pred)
			
	def find_items_recursive(self, arr_prop, idx, by_id, uid, ps, pred):
		items = []
		arr = getattr(self, arr_prop)
		
		for item in arr:
			try:
				if (not pred or pred(item)) and (not ps.predicate[idx] or eval(ps.predicate[idx])):
					if by_id:
						if item.uid == uid:
							items.append(item)
					elif fnmatch.fnmatch(item.name, ps.pat):
						items.append(item)
			except:
				continue

		if ps.mask[3]:
			for graph in self.graphs:
				items.extend(graph.find_items_recursive(arr_prop, idx, by_id, uid, ps, pred))
		
		return items
	
	def echo(self, cbs = [None, None, None]):
		headers = [ANSI_GREEN + '<GRAPH> ', ANSI_BLUE + '<NODE> ', ANSI_YELLOW + '<CONN> ']
		arrs = [self.graphs, self.nodes, self.conns]
		
		for i in range(3):
			cb = cbs[i]
			
			for item in arrs[i]:
				print(headers[i] + ANSI_ENDC + item.name + ' (' + str(item.uid) +')')
				
				if cb:
					cb(item)
	
	def dump(self, ps, cbs):
		g = self.find_all(ps)
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
		self.filename = filename if filename else ''
		self.root_graph = Graph('Root', None, None, data['root']) if filename else Graph('Default graph', None, None, None)
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
		if args == '': return
		
		args = shlex.split(args)
		
		if args[0] == '..':
			if self.current_graph.parent_graph == None:
				print('*** You\'re already in the root.')
			else:
				self.current_graph = self.current_graph.parent_graph
				self.update_cwd()
		else:
			ps = ParsedSelectors(args)
			ps.mask = [True, False, False, False]
			g = self.current_graph.find_all(ps)
			count = g.get_item_count()
			
			if count < 1:
				print('*** No such graph: ' + ps.pat)
				return
			elif count > 1:
				print('\nThe specified graph \'' + ps.pat + '\' is named ambigously. Which graph did you mean:\n')
				g.echo()		
				return

			self.current_graph = g.graphs[0]
			self.update_cwd()
		
	def print_summary(self, count):
		delim = ''
		
		if count[0] == 0 and count[1] == 0 and count[2] == 0:
			delim = '---\n'
		
		print(delim + '\n%d graphs, %d nodes and %d connections.' % (count[0], count[1], count[2]))
	
	def ls(self, args):
		args = shlex.split(args)
		print('')
		self.print_summary(self.current_graph.dump(ParsedSelectors(args), [None, None, None]))
	
	def alter_data_query(self, cb, desc, query):
		print('\n' + ANSI_RED + desc + ':\n' + ANSI_ENDC)
		cb()
		inp = raw_input('\n' + query + '. Continue (y/n)? ')
		
		return inp == 'yes' or inp == 'y'
	
	def rm(self, args):
		args = shlex.split(args)
		
		if len(args) < 1:
			print('*** Nothing to remove.')
		
		ps = ParsedSelectors(args)
		g = self.current_graph.find_all(ps)
		
		if ps.mask[1]:
			for node in g.nodes:
				g.conns.extend(node.get_conns())
		
		g.conns = list(set(g.conns))
		pending = g.get_item_count()
		
		if pending > 0:
			if self.alter_data_query(lambda: g.echo(), 'This action will delete the following objects', 'This operation will destroy data'):
				self.current_graph.delete(g)
				print('\nRemoved %d graphs, %d nodes and %d connections.' % (len(g.graphs), len(g.nodes), len(g.conns)))
		else:
			print('*** Nothing to remove.')
	
	def dump(self, args):
		args = shlex.split(args)
		
		def dump_json(i): print(json.dumps(i.data, indent = 2, sort_keys = False) + '\n')
		
		self.print_summary(self.current_graph.dump(ParsedSelectors(args), [dump_json, dump_json, dump_json]))
	
	def refac(self, args):
		args = shlex.split(args)
		ps = ParsedSelectors(args)
		tok = shlex.split(ps.pat)
		
		if len(tok) < 4:
			print('*** Missing argument(s).')
		
		prop = tok[0]
		old_val = tok[1]
		new_val = tok[2]
		ps.pat = tok[3]
		
		if old_val.isdigit():
			old_val = int(old_val)
			new_val = int(new_val)
		
		def pred(i):
			print(i.data[prop])
			return hasattr(i, prop) and i.data[prop] == old_val
		
		def show_prop(i):
			print('(%s).%s: %s -> %s' % (i.name, prop, str(i.data[prop]), tok[2]))
		
		def set_prop(i):
			i.data[prop] = new_val
		
		g = self.current_graph.find_all(ps, [pred, pred, pred])
		pending = g.get_item_count()
				
		if pending > 0:
			if self.alter_data_query(lambda: g.iterate([show_prop, show_prop, show_prop], mask), 'This action will change the following objects', 'This operation will alter data'):
				g.iterate([set_prop, set_prop, set_prop], mask)
				print('\nChanged %d graphs, %d nodes and %d connections.' % (len(g.graphs), len(g.nodes), len(g.conns)))
		else:
			print('Nothing to refactor.')

	def save(self, args):
		args = shlex.split(args)
		f = open(self.filename, 'w')
		
		# TODO: The ordering of the keys is not maintained!
		f.write(json.dumps(self.data, indent=4, sort_keys=False))
		f.close()
		
		print('Saved to ' + self.filename)

class Expression:
	def __init__(self, context, args):
		g = context.current_graph.find_all()

context = Context({}, None)

def load_file(filename):
	global context
	
	with codecs.open(filename, 'r', 'utf-8-sig') as json_data:
		context = Context(json.load(json_data, object_pairs_hook = collections.OrderedDict), filename)
	
	print('Editing: ' + filename)
	
class Shell(cmd.Cmd):
	def set_prompt(self):
		self.prompt = '\n' + ANSI_PROMPT + context.cwd + '> ' + ANSI_ENDC
	
	def help_flags(self):
		print('* Where ' + ANSI_GREEN + '<sel>' + ANSI_ENDC + ' is specified, this means: wildcard pattern')
		print('or id <n>, where <n> is the uid of the desired object.')
		print('')
		print('* Where ' + ANSI_GREEN + '-gncr' + ANSI_ENDC + ' flags can be supplied these limit the operation')
		print('to (g)raphs, (n)odes or (c)onnections or (r)ecurses into')
		print('child graphs. Any combination can be specified, ex.: -gc,')
		print('-rgn and so on. The default is to operatate on all three')
		print('types without recursion.')
	
	def do_cd(self, args):
		context.cd(args)
		self.set_prompt()
	
	def help_cd(self):
		print(ANSI_GREEN + 'cd <sel | ..>' + ANSI_ENDC + ':\nMoves up to the parent graph or into the first child graph\nthe name pattern or uid supplied.')
	
	def do_ls(self, args):
		context.ls(args)
	
	def help_ls(self):
		print(ANSI_GREEN + 'ls [-gncr] [-p <python>] [sel]' + ANSI_ENDC + ':\nList the contents of the current graph. If no selector is given,\neverything is listed.')
	
	def do_rm(self, args):
		context.rm(args)
	
	def help_rm(self):
		print(ANSI_GREEN + 'rm [-gncr] [-p <python>] <sel>' + ANSI_ENDC + ':\nRemoves the specified items from the current graph. Will display\nthe pending set and ask for confirmation before proceeding.')
	
	def do_dump(self, args):
		context.dump(args)
	
	def help_dump(self):
		print(ANSI_GREEN + 'dump [-gncr] [-p <python>] [sel]' + ANSI_ENDC + ':\nDumps the json of the matching objects. If not selector is given,\neverything is dumped.')
		
	def do_refac(self, args):
		context.refac(args)
	
	def help_refac(self):
		print(ANSI_GREEN + 'refac [-gncr] [-p <python>] <property name> <old value> <new value> <sel>' + ANSI_ENDC + ':\nDumps the json of the matching objects.')
	
	def do_save(self, args):
		context.save(args)
	
	def help_save(self):
		print(ANSI_GREEN + 'save' + ANSI_ENDC + ':\nSaves the current file to the original filename.')
	
	def do_exit(self, args):
		sys.exit('Session closed.')
		
	def help_exit(self):
		print(ANSI_GREEN + 'exit' + ANSI_ENDC + ':\nEnd the current session, discarding all unsaved changes.')
	
	def help_help(self):
		pass

def repl():
	s = Shell()
	s.set_prompt()
	
	try:
		s.cmdloop()
	except DelegationException:
		s.cmdloop()

print(ANSI_GREEN + '\nEdit Graph\n----------' + ANSI_ENDC + '\n')

if len(sys.argv) < 2:
	sys.exit('Usage: edit-graph.py <graph.json>')
	
load_file(sys.argv[1])
repl()
