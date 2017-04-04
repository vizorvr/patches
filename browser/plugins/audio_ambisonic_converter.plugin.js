(function(){

var AmbisonicConverterPlugin = E2.plugins.audio_ambisonic_converter = function(core, node) {
    Plugin.apply(this, arguments)

    // Describe plugin and inputs/outputs
    var self = this;
    this.desc = 'Decode an ambisonic spherical recording to headphones.';
    this.input_slots = [
                    { name: 'audio_in',
                    dt: core.datatypes.OBJECT,
                    desc: 'A 4-channel B-format audio stream to convert.',
                    def: null },
                    { name: 'convention',
                    dt: core.datatypes.FLOAT,
                    desc: 'Ambisonic convention: 0:ACN/N3D, 1:WXYZ/FuMa, 2:ACN/SN3D, .',
                    def: null }
                     ];
    this.output_slots = [
                { name: 'audio_out',
                  dt: core.datatypes.OBJECT,
                  desc: 'A converted 4-channel B-format audio stream.' }
                ];
    // Load external library
    core.add_aux_script('ambisonics/ambisonics.umd.js')
    .then(function() {

        // Initialize ambisonic nodes
        console.log(ambisonics);
        self.converter_node1 = core.audioContext ? new ambisonics.converters.wxyz2acn(core.audioContext) : null;
        self.converter_node2 = core.audioContext ? new ambisonics.converters.sn3d2n3d(core.audioContext, 1) : null;
          
    })
    .catch(function(err) {
        console.error(err.stack)
    });

    // internal vars
    this.src = null;
    this.convention = 0;
    this.conventionChanged = true;
    this.out_node = null;
 
    this.first = true;

};
 
AmbisonicConverterPlugin.prototype = Object.create(Plugin.prototype);


AmbisonicConverterPlugin.prototype.reset = function() {
    this.first = true;
};
 
 
AmbisonicConverterPlugin.prototype.update_input = function(slot, data) {
    switch(slot.name) {
        case 'audio_in':
            if (this.src) this.src.disconnect(0);
            this.src = data;
            this.update_connections();
        case 'convention':
            if (data!=this.convention) {
                switch(data) {
                    case 0:
                        this.convention = 0;
                        this.conventionChanged = true;
                        break;
                    case 1:
                        this.convention = 1;
                        this.conventionChanged = true;
                        break;
                    case 2:
                        this.convention = 2;
                        this.conventionChanged = true;
                }
            }
    }
};
 
 
AmbisonicConverterPlugin.prototype.update_output = function(slot) {
    return this.out_node;
};
 
 
AmbisonicConverterPlugin.prototype.update_state = function() {
    this.first = false;
    if (this.src) {
        if (this.conventionChanged) {
            this.update_connections();
            this.connectionChanged = false;
        }
    }
};
 
AmbisonicConverterPlugin.prototype.update_connections = function() {
    this.src.disconnect(0);
    switch(this.convention) {
        case 0:
            this.out_node = this.src;
            console.log('Ambiconverter: Convention ACN/N3D (MPEG-H)')
            break;
        case 1:
            this.src.connect(this.converter_node1.in);
            this.out_node = this.converter_node1.out;
            this.out_node.player = this.src.player;
            console.log('Ambiconverter: Convention WXYZ/FuMa (traditional, Soundfield)')
            break;
        case 2:
            this.src.connect(this.converter_node2.in);
            this.out_node = this.converter_node2.out;
            this.out_node.player = this.src.player;
            console.log('Ambiconverter: Convention ACN/SN3D (ambiX, Youtube)')
    }
};
 
})();
 