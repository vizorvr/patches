# Clamped accumulate

## Description
Every input **value** is accumulated in an internal buffer. The buffer value is not permitted to be smaller then **min** or larger than **max**.

## Inputs
### value

*Float*

A small value to be accumulated in an internal buffer.

### min

*Float*

Minimum internal buffer value.

### max

*Float*

Maximum internal buffer value.

### reset

*Float*

Send a value to this slot to reset the accumulator to that value.

## Outputs
### value

*Float*

The current value of the accumulation buffer.

## Detail

