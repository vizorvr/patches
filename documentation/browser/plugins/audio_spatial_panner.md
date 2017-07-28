#Spatial Panner

##Description
Spatial Panner.

##Inputs
###source
An audio source to spatialize.

###position
Position.

###orientation
Orientation.

###coneInnerAngle
The **angle**, in **degrees**, of a cone _inside of which_ there will be no **volume reduction**.

###coneOuterAngle
The **angle**, in **degrees**, of a cone _outside of which_ the volume will be reduced by a **constant value**, defined by the **coneOuterGain** attribute.

###coneOuterGain
The amount of **volume reduction** _outside the cone_ defined by the **coneOuterAngle** attribute. Its default value is **0**, meaning that no sound can be heard.

###refDistance
The **reference distance** for reducing volume as the audio source moves further from the listener.

###maxDistance
A **value** representing the **maximum distance** between the audio source and the listener, after which the volume is not reduced any further.

###rolloff
A **value** describing how quickly the volume is reduced as the source moves away from the listener.

##Outputs
###source
A spatialized audio source

##Detail

