#!/usr/bin/python
import fnmatch
import os
import sys

inp_path = '../../../models'

for model_id in os.listdir(inp_path):
	base = inp_path + '/' + model_id + '/'
	print model_id
	if os.path.isdir(base):
		models = []
		
		for root, dirs, files in os.walk(base):
			for filename in fnmatch.filter(files, '*.dae'):
				models.append(os.path.join(root, filename))
		
		if len(models):
			print 'Converting ' + models[0]
			os.system('./convert.py "' + models[0] + '" "../../data/scenes/' + model_id + '"')
