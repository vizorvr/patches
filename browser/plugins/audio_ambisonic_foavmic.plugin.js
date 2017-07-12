(function(){

var AmbisonicVmicPlugin = E2.plugins.audio_ambisonic_foavmic = function(core, node) {
    Plugin.apply(this, arguments)

    // Describe plugin and inputs/outputs
    var self = this;
    this.desc = 'Mirror an ambisonic spherical recording across the principal planes.';
    this.input_slots = [
                    { name: 'audio_in',
                    dt: core.datatypes.OBJECT,
                    desc: 'A 4-channel B-format audio stream.',
                    def: null },
                    { name: 'direction',
                    dt: core.datatypes.VECTOR,
                    desc: 'Orientation vector of virtual microphone.',
                    def: core.renderer.vector_origin },
                    { name: 'mic_type',
                    dt: core.datatypes.FLOAT,
                    desc: 'Type of virtual microphone: 0:Cardioid, 1:Supercardioid, 2:Hypercardioid.',
                    def: null }
                     ];
    this.output_slots = [
                { name: 'audio_out',
                  dt: core.datatypes.OBJECT,
                  desc: 'A monophonic virtual microphone audio stream.' }
                ];
    // Load external library
    core.add_aux_script('ambisonics/ambisonics.umd.js')
    .then(function() {
        // Initialize ambisonic nodes
        console.log(ambisonics);
        self.vmic_node = core.audioContext ? new ambisonics.virtualMic(core.audioContext, 1) : null;
    })
    .catch(function(err) {
        console.error(err.stack)
    });

    // internal vars
    this.src = null;
    this.direction = null;
    this.mic_type = null;
 
    this.first = true;

};
 
AmbisonicVmicPlugin.prototype = Object.create(Plugin.prototype);


AmbisonicVmicPlugin.prototype.reset = function() {
    this.first = true;
};
 
 
AmbisonicVmicPlugin.prototype.update_input = function(slot, data) {
    switch(slot.name) {
        case 'audio_in':
            if (this.src) this.src.disconnect(0);
            this.src = data;
            if (data) {
                this.src.connect(this.vmic_node.in);
                this.vmic_node.out.player = data.player;
            }
            break;
        case 'direction':
            this.direction = data;
            if (data) this.direction.normalize();
            break;
        case 'mic_type':
                switch(data) {
                    case 0:
                        this.mic_type = "cardioid";
                        break;
                    case 1:
                        this.mic_type = "supercardioid";
                        break;
                    case 2:
                        this.mic_type = "hypercardioid";
                }
    }
};
 
 
AmbisonicVmicPlugin.prototype.update_output = function(slot) {
    return this.vmic_node.out;
};
 
 
AmbisonicVmicPlugin.prototype.update_state = function() {
    if (this.mic_type!=this.vmic_node.vmicPattern) {
        this.vmic_node.vmicPattern = this.mic_type;
        this.vmic_node.updatePattern();
            switch(this.mic_type) {
                case "cardioid":
                console.log('AmbiVmic: Cardioid');
                break;
                case "supercardioid":
                console.log('AmbiVmic: Supercardioid');
                break;
                case "hypercardioid":
                console.log('AmbiVmic: Hypercardioid');
        }
    }
 
    var self = this;
    function cart2sph() {
        var azim, elev, azimElev;
        azim = Math.atan2(self.direction.y, self.direction.x)*180/Math.PI;
        elev = Math.atan2(self.direction.z, Math.sqrt(self.direction.y*self.direction.y + self.direction.x*self.direction.x))*180/Math.PI;
        azimElev = [azim, elev];
        //        console.log(azimElev)
        return azimElev;
    }
    if (this.direction !== null) {
        var azimElev = cart2sph();
        this.vmic_node.azim = azimElev[0];
        this.vmic_node.elev = azimElev[1];
        this.vmic_node.updateOrientation();
    }
 
 this.first = false;
};
 
})();
 
