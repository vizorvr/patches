#Gain (mix)

##Description
Spatialize an audio source.

##Inputs
###source
An audio source.

###position
Position of an audio source.

###orientation
Orientation of an audio source.

###coneinnerangle
Cone Inner Angle.
The angle, in degrees, of a cone inside of which there will be no volume reduction.

###coneouterangle
Cone Outer Angle.
The angle, in degrees, of a cone outside of which the volume will be reduced by a constant value, defined by the coneOuterGain attribute.

###coneoutergain
The amount of volume reduction outside the cone defined by the coneOuterAngle attribute. Its default value is 0, meaning that no sound can be heard.

###refdistance
Reference Distance.
The reference distance for reducing volume as the audio source moves further from the listener.

###maxdistance
A value representing the maximum distance between the audio source and the listener, after which the volume is not reduced any further.

###rolloff
A value describing how quickly the volume is reduced as the source moves away from the listener.


##Outputs
###source
Output.

##Detail

