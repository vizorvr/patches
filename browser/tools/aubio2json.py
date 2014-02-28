#!/usr/bin/env python
import sys
import math

def rprint(s):
	sys.stdout.write(s)
	sys.stdout.flush()

def calc_frame(s):
	return int((float(s) * 30.0) + 0.5)

lines = sys.stdin.readlines()
frame_count = calc_frame(lines[-1]) + 1
frames = [0] * frame_count

for line in lines:
	frames[calc_frame(line)] = True

rprint('{ "data": [')
delim = ''

for i in range(len(frames)):
	if frames[i]:
		rprint(delim + '1')
	else:
		rprint(delim + '0')
	
	delim = ','

print ']}'
