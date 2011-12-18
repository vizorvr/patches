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
	
print 'Copying structure themes...'
themes_path = scripts_path + 'themes'
shutil.copytree(themes_path, build_dir + '/' + themes_path)

print 'Compressing plugins...'
plugins_path = 'plugins/'
os.mkdir(build_dir + '/' + plugins_path)
plugins = map(lambda x: x[len(plugins_path):], glob.glob(plugins_path + '*.js'))

for plugin in plugins:
	print '\tCompressing ' + plugin
	os.system('yui-compressor --type js --preserve-semi -o ' + build_dir + '/' + plugins_path + plugin + ' ./' + plugins_path + plugin)

print 'Concatenating plugins...'

plugin_data = []

for plugin in plugins:
	'Munching ' + plugin
	
	for line in open(plugins_path + plugin, 'r'):
		plugin_data.append(line)

plugs_concat_filename = build_dir + '/' + plugins_path + 'all.plugins'
plugs_concat_file = open(plugs_concat_filename, 'w')
plugs_concat_file.write(''.join(plugin_data))
plugs_concat_file.close()

print 'Reobfuscating merged plugin package...'

os.system('yui-compressor --type js --preserve-semi -o ' + plugs_concat_filename + '.js ./' + plugs_concat_filename)
os.remove(plugs_concat_filename)


