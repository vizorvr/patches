# If ... Else

## Description
Emits **true value** if **condition** is true and **false value** otherwise. The output only updates when the **condition** or relavant input value does. Any incoming data-flow to the value slot excluded by **condition** does not result in data emission.

## Inputs
### condition

*Boolean*

Send true to route **true value** to the output and false to route **false value**.

### true value

*Arbitrary*

Value to be send to output if **condition** is true

### false value

*Arbitrary*

Value to be send to output if **condition** is false

## Outputs
### value

*Arbitrary*

Emits **true value** if **condition** is true and **false value** otherwise.

## Detail

