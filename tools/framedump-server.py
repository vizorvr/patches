#!/usr/bin/env python
from flask import Flask
from flask import request
from werkzeug import secure_filename
from PIL import Image
import numpy

app = Flask(__name__)

index = 0

@app.route('/upload', methods=['POST'])
def upload_file():
    global index
    print request.method
    if request.method == 'POST':
        w = int(request.form['width'])
        h = int(request.form['height'])
        d = numpy.fromstring(request.form['img_data'][1:-1], dtype=numpy.uint8, sep=',');
        fname = 'framedump/%06d.png' % index
        print 'Writing %s (%d x %d)' % (fname, w, h)
        img = Image.frombuffer("RGB", [w,h], d, 'raw')
        img.save(fname)
        index += 1
        return '200'
    
    abort(500)

if __name__ == '__main__':
    app.run(debug=True)
