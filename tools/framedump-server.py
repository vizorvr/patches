#!/usr/bin/env python
from flask import Flask
from flask import request
from flask import make_response
from werkzeug import secure_filename
from PIL import Image
import numpy
import os
import sys
import socket
import datetime
 
armed = False

if len(sys.argv) > 1:
	if sys.argv[1] == 'armed':
		armed = True

app = Flask(__name__)

HEADER = '\033[0;35m'
BLUE = '\033[1;34m'
OK = '\033[0;32m'
WARNING = '\033[0;33m'
FAIL = '\033[0;31m'
ENDC = '\033[0m'
    
index = 0
cache_size = 0

def timestamp():
	return datetime.datetime.now().strftime('[%H:%M:%S]: ')

def get_local_ip_address(target):
	ipaddr = ''
	
	try:
		s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
		s.connect((target, 8000))
		ipaddr = s.getsockname()[0]
		s.close()
	except:
		pass

	return ipaddr 

import socket, struct

def get_default_gateway():
	"""Read the default gateway directly from /proc."""
	with open("/proc/net/route") as fh:
		for line in fh:
			fields = line.strip().split()
			
			if fields[1] != '00000000' or not int(fields[3], 16) & 2:
				continue

			return socket.inet_ntoa(struct.pack("<L", int(fields[2], 16)))

def sizeof_fmt(num):
	for x in ['bytes','KB','MB','GB']:
		if num < 1024.0:
			return "%3.1f %s" % (num, x)
		
		num /= 1024.0
	
	return "%3.1f %s" % (num, 'TB')

@app.route('/reset', methods=['GET'])
def reset():
	global index
	global cache_size
	
	print '%s%sALLOW%s from %s%s%s - reset requested.' % (timestamp(), WARNING, ENDC, BLUE, request.remote_addr, ENDC)
	index = 0
	cache_size = 0
	os.system('rm -rf ./cache/*.png')
	r = make_response('200')
	r.headers['Access-Control-Allow-Origin'] = '*'
	
	return r

@app.route('/', methods=['POST'])
def upload_file():
    global index
    global cache_size
    
    if request.method == 'POST':
    	err = False
    	
    	if not 'width' in request.form:
    		print '%s%sDENY%s: The client did not specify a width.' % (timestamp(), FAIL, ENDC)
		abort(500)
    		
    	if not 'height' in request.form:
    		print '%s%sDENY%s: The client did not specify a height.' % (timestamp(), FAIL, ENDC)
		abort(500)
    	
    	if not 'img_data' in request.form:
    		print '%s%sDENY%s: The client did not specify any image data.' % (timestamp(), FAIL, ENDC)
		abort(500)

    	if not 'Origin' in request.headers:
    		print '%s%sDENY%s: The client did not specify a CORS origin header.' % (timestamp(), FAIL, ENDC)
		abort(500)

	w = int(request.form['width'])
	h = int(request.form['height'])
	d = numpy.fromstring(request.form['img_data'][1:], dtype=numpy.uint8, sep=',');
	fname = 'cache/%08d.png' % index
	
	img = Image.frombuffer('RGB', [w,h], d, 'raw', 'RGB', 0, 1)
	img.save(fname)
	cache_size = cache_size + os.path.getsize(fname)
	index += 1
	
	print '%s%sALLOW%s from %s%s%s frame %d (%d x %d), cache size = %s' % (timestamp(), OK, ENDC, BLUE, request.remote_addr, ENDC, index, w, h, sizeof_fmt(cache_size))

	r = make_response('200')
	r.headers['Access-Control-Allow-Origin'] = '*'
	
	return r

if __name__ == '__main__':
	print HEADER + 'ENGI Framedump Server' + ENDC + ' [IP: ' + BLUE + get_local_ip_address(get_default_gateway()) + ENDC + ']'
	
	if armed:
		app.run(host = '0.0.0.0', debug = False)
	else:
		app.run(debug = True)
