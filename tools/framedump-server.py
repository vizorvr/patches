#!/usr/bin/env python
from flask import Flask
from flask import request
from flask import make_response
from werkzeug import secure_filename
from PIL import Image
import numpy

app = Flask(__name__)

index = 0

@app.route('/', methods=['POST'])
def upload_file():
    global index
    
    print request.method
    
    if request.method == 'POST':
    	if request.headers['Origin']:
    		print 'Allowing request to upload from \'' + request.headers['Origin'] + '\'.'
		w = int(request.form['width'])
		h = int(request.form['height'])
		d = numpy.fromstring(request.form['img_data'][1:], dtype=numpy.uint8, sep=',');
		fname = 'framedump/%06d.png' % index
		print 'Writing %s (%d x %d), computed size = %d, actual size = %d' % (fname, w, h, w * h, len(d))
		img = Image.frombuffer("RGB", [w,h], d, 'raw')
		img.save(fname)
		index += 1
    		r = make_response('200')
    		r.headers['Access-Control-Allow-Origin'] = '*'
    		return r
    	else:
    		abort(404)
    
    abort(500)

if __name__ == '__main__':
    app.run(debug=True)
