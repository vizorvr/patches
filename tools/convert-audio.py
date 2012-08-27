#!/usr/bin/python
import os
import sys

if len(sys.argv) < 3:
	sys.exit('Usage: convert-audio.py <input sample> <output dir>')

input_filename = sys.argv[1]
output_dir = os.path.abspath(sys.argv[2])

if not os.path.exists(input_filename):
    sys.exit('[Error]: Cannot access "%s".' % input_filename)
if output_dir[len(output_dir)-1] == '/':
	output_dir = output_dir[:-1]

output_dir = os.path.expanduser(output_dir)
 
def ensure_dir(f):
	print 'Output to ' + f + ' (exists = ' + str(os.path.exists(f)) + ').'
	
	if not os.path.exists(f):
		print '\t* Doesn\'t exist, creating...'
		os.makedirs(f)

ensure_dir(output_dir)
fname = os.path.splitext(os.path.split(input_filename)[1])[0]

os.system('ffmpeg -i "%s" "%s/%s.wav"' % (input_filename, output_dir, fname))
os.system('ffmpeg -i "%s" "%s/%s.ogg"' % (input_filename, output_dir, fname))
os.system('ffmpeg -i "%s" "%s/%s.mp3"' % (input_filename, output_dir, fname))
os.system('ffmpeg -i "%s" "%s/%s.mp4"' % (input_filename, output_dir, fname))
os.system('ffmpeg -i "%s" "%s/%s.webm"' % (input_filename, output_dir, fname))
