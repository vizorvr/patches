import math
import struct
import wave
import sys

w = wave.open(sys.argv[1], 'rb')
# We assume 44.1k @ 16-bit, can test with getframerate() and getsampwidth().
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
    
for i in xrange(0, w.getnframes()):
	# Assume stereo, mix the channels.
	data = struct.unpack('<hh', w.readframes(1))
	sum += (data[0] + data[1]) / 65536.0
	# 44100 / 30 = 1470
	if (i != 0 and (i % 1470) == 0):
		value = sum / 1470.0
		
		if value < 0:
			value = -value
		
		if value < 0.00001:
			value = 0.0

		amps.append(value)
		sum = 0

print '{ "data": ' + str(map(cnr, amps)) + '}'

