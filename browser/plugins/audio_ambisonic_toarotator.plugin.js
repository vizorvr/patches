(function(){

var AmbisonicRotatorPlugin = E2.plugins.audio_ambisonic_toarotator = function(core, node) {
    Plugin.apply(this, arguments)

    // Describe plugin and inputs/outputs
    var self = this;
    this.desc = 'Rotate an ambisonic spherical recording.';
    this.input_slots = [
                    { name: 'audio_in',
                    dt: core.datatypes.OBJECT,
                    desc: 'A 16-channel TOA audio stream to rotate.',
                    def: null },
                    { name: 'rotation',
                    dt: core.datatypes.VECTOR,
                    desc: 'Head/camera rotation.',
                    def: core.renderer.vector_origin }
                     ];
    this.output_slots = [
                { name: 'audio_out',
                  dt: core.datatypes.OBJECT,
                  desc: 'A rotated 16-channel TOA audio stream.' }
                ];
    // Load external library
    core.add_aux_script('ambisonics/ambisonics.umd.js')
    .then(function() {

        // Initialize ambisonic nodes
        console.log(ambisonics);
        self.rotator_node = core.audioContext ? new ambisonics.sceneRotator(core.audioContext, 3) : null;
    })
    .catch(function(err) {
        console.error(err.stack)
    });

    // internal vars
    this.src = null;
    this.rotation = new THREE.Vector3(0, 0, 0);
 
    this.first = true;

};
 
AmbisonicRotatorPlugin.prototype = Object.create(Plugin.prototype);


AmbisonicRotatorPlugin.prototype.reset = function() {
    this.first = true;
};
 
 
AmbisonicRotatorPlugin.prototype.update_input = function(slot, data) {
    switch(slot.name) {
        case 'audio_in':
            if (this.src) this.src.disconnect(0);
            this.src = data;
            if (data) {
                this.src.connect(this.rotator_node.in);
                this.rotator_node.out.player = data.player;
            }
            break;
        case 'rotation':
            if (data) this.rotation = data;
    }
};
 
 
AmbisonicRotatorPlugin.prototype.update_output = function(slot) {
    return this.rotator_node.out;
};
 
 
AmbisonicRotatorPlugin.prototype.update_state = function() {
    var self = this;
    function getCamera2AmbisonicRot() {
        var yaw, pitch, roll, rotAngles;
        yaw = self.rotation.y*180/Math.PI;
        pitch = -self.rotation.x*180/Math.PI;
        roll = -self.rotation.z*180/Math.PI;
        rotAngles = [yaw, pitch, roll];
        //        console.log(rotAngles)
        return rotAngles;
    }
    if (this.rotation !== null) {
        var rotAngles = getCamera2AmbisonicRot();
        this.rotator_node.yaw = rotAngles[0];
        this.rotator_node.pitch = rotAngles[1];
        this.rotator_node.roll = rotAngles[2];
        this.rotator_node.updateRotMtx();
    }
    this.first = false;
};
 
})();
 