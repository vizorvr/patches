(function(){

var AmbisonicEncoderPlugin = E2.plugins.audio_ambisonic_toaencoder = function(core, node) {
    Plugin.apply(this, arguments)

    // Describe plugin and inputs/outputs
    var self = this;
    this.desc = 'Encode a monophonic sound to an ambisonic 4-channel B-format stream.';
    this.input_slots = [
                    { name: 'audio_in',
                    dt: core.datatypes.OBJECT,
                    desc: 'A mono audio stream to encode.',
                    def: null },
                    { name: 'direction',
                    dt: core.datatypes.VECTOR,
                    desc: 'Direction vector.',
                    def: core.renderer.vector_origin }
                     ];
    this.output_slots = [
                { name: 'audio_out',
                  dt: core.datatypes.OBJECT,
                  desc: 'A 16-channel TOA audio stream.' }
                ];
    // Load external library
    core.add_aux_script('ambisonics/ambisonics.umd.js')
    .then(function() {

        // Initialize ambisonic nodes
        console.log(ambisonics);
        self.encoder_node = core.audioContext ? new ambisonics.monoEncoder(core.audioContext, 3) : null;
    })
    .catch(function(err) {
        console.error(err.stack)
    });

    // internal vars
    this.src = null;
    this.direction = null;
 
    this.first = true;

};
 
AmbisonicEncoderPlugin.prototype = Object.create(Plugin.prototype);


AmbisonicEncoderPlugin.prototype.reset = function() {
    this.first = true;
};
 
 
AmbisonicEncoderPlugin.prototype.update_input = function(slot, data) {
    switch(slot.name) {
        case 'audio_in':
            if (this.src) this.src.disconnect(0);
            this.src = data;
            if (data) {
                this.src.connect(this.encoder_node.in);
                this.encoder_node.out.player = this.src.player;
            }
            break;
        case 'direction':
            this.direction = data;
            if (data) this.direction.normalize();
    }
};
 
 
AmbisonicEncoderPlugin.prototype.update_output = function(slot) {
    return this.encoder_node.out;
};
 
 
AmbisonicEncoderPlugin.prototype.update_state = function() {

    function cart2sph(dir_vec) {
        var azim, elev, azimElev;
        azim = Math.atan2(dir_vec.y, dir_vec.x)*180/Math.PI;
        elev = Math.atan2(dir_vec.z, Math.sqrt(dir_vec.y*dir_vec.y + dir_vec.x*dir_vec.x))*180/Math.PI;
        azimElev = [azim, elev];
//        console.log(azimElev)
        return azimElev;
    }
    if (this.direction !== null) {
        var azimElev = cart2sph(this.direction);
        this.encoder_node.azim = azimElev[0];
        this.encoder_node.elev = azimElev[1];
        this.encoder_node.updateGains();
    }
    this.first = false;
};

})();
 
