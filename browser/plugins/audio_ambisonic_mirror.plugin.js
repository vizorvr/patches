(function(){

var AmbisonicMirrorPlugin = E2.plugins.audio_ambisonic_mirror = function(core, node) {
    Plugin.apply(this, arguments)

    // Describe plugin and inputs/outputs
    var self = this;
    this.desc = 'Mirror an ambisonic spherical recording across the principal planes.';
    this.input_slots = [
                    { name: 'audio_in',
                    dt: core.datatypes.OBJECT,
                    desc: 'A 4-channel B-format audio stream.',
                    def: null },
                    { name: 'mirror_plane',
                    dt: core.datatypes.FLOAT,
                    desc: 'Plane to mirror: 0:None, 1:Front-Back, 2:Left-Right, 3:Up-Down.',
                    def: null }
                     ];
    this.output_slots = [
                { name: 'audio_out',
                  dt: core.datatypes.OBJECT,
                  desc: 'A mirrored 4-channel B-format audio stream.' }
                ];
    // Load external library
    core.add_aux_script('ambisonics/ambisonics.umd.js')
    .then(function() {
        // Initialize ambisonic nodes
        console.log(ambisonics);
        self.mirror_node = core.audioContext ? new ambisonics.sceneMirror(core.audioContext, 1) : null;
    })
    .catch(function(err) {
        console.error(err.stack)
    });

    // internal vars
    this.src = null;
    this.mirror_plane = 0;
 
    this.first = true;

};
 
AmbisonicMirrorPlugin.prototype = Object.create(Plugin.prototype);


AmbisonicMirrorPlugin.prototype.reset = function() {
    this.first = true;
};
 
 
AmbisonicMirrorPlugin.prototype.update_input = function(slot, data) {
    switch(slot.name) {
        case 'audio_in':
            if (this.src) this.src.disconnect(0);
            this.src = data;
            if (data) {
                this.src.connect(this.mirror_node.in);
                this.mirror_node.out.player = data.player;
            }
            break;
        case 'mirror_plane':
                switch(data) {
                    case 0:
                        this.mirror_plane = 0;
                        break;
                    case 1:
                        this.mirror_plane = 1;
                        break;
                    case 2:
                        this.mirror_plane = 2;
                        break;
                    case 3:
                        this.mirror_plane = 3;

                }
    }
};
 
 
AmbisonicMirrorPlugin.prototype.update_output = function(slot) {
    return this.mirror_node.out;
};
 
 
AmbisonicMirrorPlugin.prototype.update_state = function() {
    if (this.mirror_plane!=this.mirror_node.mirrorPlane) {
        this.mirror_node.mirror(this.mirror_plane);
            switch(this.mirror_plane) {
                case 0:
                console.log('AmbiMirror: No mirroring');
                break;
                case 1:
                console.log('AmbiMirror: Front-back mirroring');
                break;
                case 2:
                console.log('AmbiMirror: Left-right mirroring');
                break;
                case 3:
                console.log('AmbiMirror: Up-down mirroring');
        }
 
    }
    this.first = false;
};
 
})();
 