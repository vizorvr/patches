# Lowpass Filter

## Description
Perform simple 1st-order lowpass filtering of the supplied value. **Caution:** Do not use this plugin to filter infrequently updated values. This plugin expects continuous input every frame; if necessary, a clock or another cheap continuous float provider can be multiplied by zero and added to the lowpass input to drive updates.

## Inputs
### value

*Float*

Input value. Must be updated every frame for correct operation of the filter.

### amount

*Float*

Filter amount. Zero is pure passthrough, 0.999 maximum filtering.

## Outputs
### result

*Float*

The smoothed output value

## Detail

