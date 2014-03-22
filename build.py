#!/usr/bin/python
import os
import sys
import fnmatch
import glob
import shutil
import subprocess

def glob_recursive(base_path, pattern):
	matches = []

	for root, dirnames, filenames in os.walk(base_path):
		for filename in fnmatch.filter(filenames, pattern):
			matches.append(os.path.join(root, filename))
	
	return matches

src_dir = 'browser'
build_dir = 'browser/build'

def run(exe):    
	p = os.popen(exe)
	return p.read()

def compress(in_name, out_name):
	# os.system('yui-compressor --type js --preserve-semi -o ' + out_name + ' ' + in_name)
	os.system('node_modules/uglify-js2/bin/uglifyjs2 -c dead-code=false,unused=false -o ' + out_name + ' ' + in_name)

def compress_css(in_name, out_name):
	cmd = 'java -jar node_modules/yui-compressor/lib/vendor/yuicompressor.jar --type css -o ' + out_name + ' ' + in_name
	# print cmd
	os.system(cmd)

# Make sure the output directory exists
if not os.path.exists(build_dir):
	os.system('mkdir ' + build_dir)
	
# Debugger statements will make uglify barf, Make sure we haven't left any behind by accident.
print 'Checking for residual debugger statements...'

if os.system('grep -n "debugger;" ' + src_dir + '/plugins/*.js') == 0:
	sys.exit(0)

if os.system('grep -n "debugger;" ' + src_dir + '/scripts/*.js') == 0:
	sys.exit(0)

print 'Rebuilding...'
shutil.rmtree(build_dir)
os.mkdir(build_dir)

print 'Compressing scripts...'
scripts_path = src_dir + '/scripts/'
os.mkdir(build_dir + '/scripts/')

scripts = map(lambda x: x[len(scripts_path):], glob.glob(scripts_path + '*.js'))

for script in scripts:
	print '\t' + script
	compress(scripts_path + script, build_dir + '/scripts/' + script)
	
print 'Compressing snippets...'
snippets_path = src_dir + '/snippets/'
os.mkdir(build_dir + '/snippets/')
snippets = map(lambda x: x[len(snippets_path):], glob.glob(snippets_path + '*.json'))

for snippet in snippets:
	shutil.copy(snippets_path + snippet, build_dir + '/snippets/' + snippet)

plugins_path = src_dir + '/plugins/'
os.mkdir(build_dir + '/plugins/')
plugins = map(lambda x: x[len(plugins_path):], glob.glob(plugins_path + '*.js'))

print 'Concatenating plugins...'

plugin_data = []

for plugin in plugins:
	'\tMunching ' + plugin
	
	for line in open(plugins_path + plugin, 'r'):
		plugin_data.append(line)

plugs_concat_filename = build_dir + '/plugins/all.plugins'
plugs_concat_file = open(plugs_concat_filename, 'w')
plugs_concat_file.write(''.join(plugin_data))
plugs_concat_file.close()

print '\tMinifying plugin package.'

compress(plugs_concat_filename, plugs_concat_filename + '.js')
os.remove(plugs_concat_filename)

print '\tCopying plugin catalogue.'
os.system('cp ' + plugins_path + 'plugins.json ' + build_dir + '/plugins')

print '\tProcessing plugin dependencies'
print '\t\tACE Editor + plugins'
os.system('mkdir ' + build_dir + '/plugins/ace')
ace_files = glob.glob(src_dir + '/plugins/ace/*.js')

for ace_file in ace_files:
	print('\t\t+ ' + ace_file)
	compress(ace_file, build_dir + '/plugins/ace/' + os.path.basename(ace_file))

print '\t\tToggle button style'
os.system('mkdir ' + build_dir + '/plugins/toggle-button')
compress_css(plugins_path + 'toggle-button/style.css', build_dir + '/plugins/toggle-button/style.css')

print 'Compressing stylesheets...'
css_path = src_dir + '/style/'
os.mkdir(build_dir + '/style')
cssfiles = map(lambda x: x[len(css_path):], glob.glob(css_path + '*.css'))

for cssfile in cssfiles:
	print '\tCompressing ' + cssfile
	compress_css(css_path + cssfile, build_dir + '/style/' + os.path.basename(cssfile))

print 'Copying TrueType fonts.'
os.system('cp ' + css_path + '*.ttf ' + build_dir + '/style')

print 'Compressing plugin icons to CSS sprite sheet...'
icons_path = build_dir + '/style/icons'
os.system('mkdir ' + icons_path)
os.system('tools/compress-plugin-icons.py')

# Copy the result back to the debug version.
shutil.copy(icons_path + '/style.css', src_dir + '/style/icons/style.css')
shutil.copy(icons_path + '/icons.png', src_dir + '/style/icons/icons.png')

print 'Copying remaining required files...'

print '\tCopying images folder.'
shutil.copytree(src_dir + '/images/', build_dir + '/images/')

print '\tCopying data folder.'
shutil.copytree(src_dir + '/data/', build_dir + '/data/')

print '\tCopying vendor folder.'
shutil.copytree(src_dir + '/vendor/', build_dir + '/vendor/')

print '\tCopying help folder.'
shutil.copytree(src_dir + '/help/', build_dir + '/help/')

print '\tCopying index.html.'
os.system('cp ' + src_dir + '/*.html ' + src_dir + '/player_scene.json ' + build_dir)

print '\tCopying favicon.'
os.system('cp ' + src_dir + '/favicon.ico ' + build_dir)
