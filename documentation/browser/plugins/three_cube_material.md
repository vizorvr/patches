#Cubemap Material

##Description
Cube Shader Material.

##Inputs
###cube texture
Cube Texture

###depthWrite
enable / disable writing to the depth buffer

###opacity
Float in the range of 0.0 - 1.0 indicating how transparent the material is. A value of 0.0 indicates fully transparent, 1.0 is fully opaque. If transparent is not set to true for the material, the material will remain fully opaque and this value will only affect its color.

###transparent
Defines whether this material is transparent. When set to true, the extent to which the material is transparent is controlled by setting opacity.

###blending
Which blending to use when displaying objects with this material. Default is Normal. 0 = No, 1 = Normal, 2 = Additive, 3 = Subtractive, 4 = Multiply, 5 = Custom

###side
Defines which of the face sides will be rendered - front, back or both. 0 = Front, 1 = Back, 2 = Double Sided

##Outputs
###material
Cube Shader Material

##Detail

