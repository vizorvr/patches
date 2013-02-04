import math
import struct
import wave
import sys

if len(sys.argv) < 2:
	sys.exit('Usage: amps.py <inputfile.wav> (assumed to be 44.1Khz, 16bps signed, stereo and uncompressed)')
	
w = wave.open(sys.argv[1], 'rb')

if w.getframerate() != 44100:
	sys.exit('Error: %s had a sample rate of %d, expected 44100.' % (sys.argv[1], w.getframerate()))
	
if w.getsampwidth() != 2:
	sys.exit('Error: %s had a sample size of %d bytes, expected 2.' % (sys.argv[1], w.getsampwidth()))

sum = 0
value = 0;
amps = []

def cnr(n):
    s = '%.5f' % n

    while s[-1] == '0':
        s = s[:-1]

    if s[-1] == '.':
        s = s[:-1]

    return s
    
samples = []
max_v = 0

for i in xrange(0, w.getnframes()):
	# Assume stereo, mix the channels.
	data = struct.unpack('<hh', w.readframes(1))
	
	f = abs(data[0])
	
	if f > max_v:
		max_v = f
	
	f = abs(data[1])
	
	if f > max_v:
		max_v = f
	
	sum += (data[0] + data[1]) / 32768.0

	# 44100 / 30 = 1470
	if (i != 0 and (i % 1470) == 0):
		value = sum / 1470.0
		
		if value < 0:
			value = -value
		
		if value < 0.00001:
			value = 0.0

		samples.append(value)
		sum = 0

max_v = max_v / 32768.0
	
if max_v < 0.00001:
	max_v = 1.0

max_v = 1.0 / max_v

delim = ''
#print '{ "data": [',

for i in xrange(0, len(samples)):
	s = samples[i] * max_v
	
	sys.stdout.write("%s\n%s" % (delim, cnr(s)))
	#sys.stdout.write("%s%s" % (delim, cnr(s)))
	#sys.stdout.flush()
	delim = ','

#print ']}'

