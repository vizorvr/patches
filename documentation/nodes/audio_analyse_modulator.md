# Analyse

## Description
Frequency and time domain audio analysis.

## Inputs
### source

*Object*

An audio source to analyse.

### bin-count

*Float*

Number of FFT bins. Will be made power-of-two and clamped to 8-2048.

### multiplier

*Float*

Multiplier for each bin value

### smoothing

*Float*

Amount of FFT smoothing between frames

## Outputs
### source

*Object*

The unmodified supplied source.

### fft-bins

*Typed Array*

The FFT bins.

## Detail

