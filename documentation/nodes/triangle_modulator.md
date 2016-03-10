# Triangle

## Description
Triangle oscilator. A **time** value incrementing by one per second will yield a 1Hz output signal.

## Inputs
### time

*Float*

The current time in seconds.

## Outputs
### value

*Float*

Emits ((0.5 - |(**time** % 1.0) - 0.5|) - 0.25) * 4.

## Detail

