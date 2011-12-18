#!/usr/bin/python
import os
import sys
import fnmatch
import glob
import shutil

def glob_recursive(base_path, pattern):
	matches = []

	for root, dirnames, filenames in os.walk(base_path):
		for filename in fnmatch.filter(filenames, pattern):
			matches.append(os.path.join(root, filename))
	
	return matches

build_dir = './build'

print 'Rebuilding...'
shutil.rmtree(build_dir)
os.mkdir(build_dir)

print 'Compressing scripts...'
scripts_path = 'scripts/'
os.mkdir(build_dir + '/' + scripts_path)
scripts = map(lambda x: x[len(scripts_path):], glob.glob(scripts_path + '*.js'))

for script in scripts:
	print '\tCompressing ' + script
	os.system('yui-compressor --type js --preserve-semi -o ' + build_dir + '/' + scripts_path + script + ' ./' + scripts_path + script)
