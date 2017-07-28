#Animate Vector3 on Trigger

##Description
Animate **value** from **startValue** to **endValue** on **trigger** (Boolean) over time specified by **duration**.

##Inputs
###trigger
Sending a Boolean impulse (**True**) to **trigger** will start the **animation**.

###reset
Reset **value** back to **startValue**.

###one-shot
If **True**, only allow the animation to be triggered once (until **reset**).

###duration
**Duration** of animation.

###startValue
Animation start **value**.

###endValue
Animation end **value**.

##Outputs
###value
Output for animated **value** .

###active
**True** while the animation is active.

##Detail

