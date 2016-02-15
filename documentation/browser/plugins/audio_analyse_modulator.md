#Analyse

##Description
Frequency and time domain audio analysis.

##Inputs
###source
An audio source to analyse.

###bin-count
Number of FFT bins. Will be made power-of-two and clamped to 8-2048.

###multiplier
Multiplier for each bin value

###smoothing
Amount of FFT smoothing between frames

##Outputs
###source
The unmodified supplied source.

###fft-bins
The FFT bins.

##Detail

