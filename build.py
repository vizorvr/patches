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

build_dir = './build'

def run(exe):    
	p = os.popen(exe)
	return p.read()

def compress(in_name, out_name):
	# os.system('yui-compressor --type js --preserve-semi -o ' + out_name + ' ' + in_name)
	os.system('uglifyjs -nc -o ' + out_name + ' ' + in_name)

print 'Checking for residual debugger statements...'

if os.system('grep -n "debugger;" plugins/*.js') == 0:
	sys.exit(0)

if os.system('grep -n "debugger;" scripts/*.js') == 0:
	sys.exit(0)

print 'Rebuilding...'
shutil.rmtree(build_dir)
os.mkdir(build_dir)

print 'Compressing scripts...'
scripts_path = 'scripts/'
os.mkdir(build_dir + '/' + scripts_path)

scripts = map(lambda x: x[len(scripts_path):], glob.glob(scripts_path + '*.js'))

for script in scripts:
	print '\t' + script
	compress('./' + scripts_path + script, build_dir + '/' + scripts_path + script)
	
print 'Compressing snippets...'
snippets_path = 'snippets/'
os.mkdir(build_dir + '/' + snippets_path)
snippets = map(lambda x: x[len(snippets_path):], glob.glob(snippets_path + '*.json'))

for snippet in snippets:
	shutil.copy('./' + snippets_path + snippet, build_dir + '/' + snippets_path + snippet)

print 'Compressing plugins...'
plugins_path = 'plugins/'
os.mkdir(build_dir + '/' + plugins_path)
plugins = map(lambda x: x[len(plugins_path):], glob.glob(plugins_path + '*.js'))

for plugin in plugins:
	print '\t' + plugin
	compress('./' + plugins_path + plugin, build_dir + '/' + plugins_path + plugin)

print 'Concatenating plugins...'

plugin_data = []

for plugin in plugins:
	'\tMunching ' + plugin
	
	for line in open(plugins_path + plugin, 'r'):
		plugin_data.append(line)

plugs_concat_filename = build_dir + '/' + plugins_path + 'all.plugins'
plugs_concat_file = open(plugs_concat_filename, 'w')
plugs_concat_file.write(''.join(plugin_data))
plugs_concat_file.close()

print '\tReobfuscating merged plugin package.'

compress('./' + plugs_concat_filename, plugs_concat_filename + '.js')
os.remove(plugs_concat_filename)

print '\tDeleting temporary files...'

for plugin in plugins:
	print '\t\tRemoving ' + plugin
	os.remove(build_dir + '/' + plugins_path + plugin)

print '\tCopying plugin catalogue.'
os.system('cp ' + plugins_path + 'plugins.json ' + build_dir + '/' + plugins_path)

print 'Compressing stylesheets...'
css_path = 'style/'
os.mkdir(build_dir + '/' + css_path)
cssfiles = map(lambda x: x[len(css_path):], glob.glob(css_path + '*.css'))

for cssfile in cssfiles:
	print '\tCompressing ' + cssfile
	os.system('yui-compressor --type css -o ' + build_dir + '/' + css_path + cssfile + ' ./' + css_path + cssfile)

print 'Copying TrueType fonts.'
os.system('cp ./' + css_path + '*.ttf ' + build_dir + '/' + css_path)

print 'Compressing plugin icons to CSS sprite sheet...'
#icon_path = css_path + 'icons'
#shutil.copytree(icon_path, build_dir + '/' + icon_path)
#os.system('yui-compressor --type css -o ' + build_dir + '/' + icon_path + '/style.css ./' + icon_path + '/style.css')
os.system('mkdir build/style/icons')
os.system('tools/compress-plugin-icons.py')
shutil.copy('build/style/icons/style.css', 'style/icons/style.css')
shutil.copy('build/style/icons/icons.png', 'style/icons/icons.png')

print 'Copying dynatree skin and compressing css...'
skin_path = css_path + 'skin'
shutil.copytree(skin_path, build_dir + '/' + skin_path)
os.system('yui-compressor --type css -o ' + build_dir + '/' + skin_path + '/ui.dynatree.css ./' + skin_path + '/ui.dynatree.css')

jq_theme = 'smoothness'

print 'Copying jQuery theme \'' + jq_theme + '\'...'
jq_theme_path = css_path + jq_theme
shutil.copytree(jq_theme_path, build_dir + '/' + jq_theme_path)

jq_cssfilename = 'jquery-ui-1.8.16.custom.css'
jq_cssfilepath = jq_theme_path + '/' + jq_cssfilename

print '\tCompressing ' + jq_cssfilename
os.system('yui-compressor --type css -o ' + build_dir + '/' + jq_cssfilepath + ' ./' + jq_cssfilepath)

print 'Copying remaining required files...'

print '\tCopying images folder.'
shutil.copytree('images/', build_dir + '/images/')

print '\tCopying data folder.'
shutil.copytree('data/', build_dir + '/data/')

print '\tCopying help folder.'
shutil.copytree('help/', build_dir + '/help/', False, shutil.ignore_patterns('*.markdown'))

print '\tBuilding help files...'
markdown_files = glob.glob('help/*.markdown')

for markdown in markdown_files:
	print '\t' + markdown
	os.system('markdown ' + markdown + ' > build/' + markdown[:-9] + '.html')

print '\tCopying index.html.'
os.system('cp index.html player.html player_scene.json ' + build_dir)

print '\tCopying favicon.'
os.system('cp favicon.ico ' + build_dir)

print '\tCreating change log.'
os.system('git log --pretty="%H%x09%an%x09%ad%x09%s" > build/changelog.txt')
