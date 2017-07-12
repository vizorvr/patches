(function(){

var AmbisonicDecoderPlugin = E2.plugins.audio_ambisonic_toadecoder = function(core, node) {
    Plugin.apply(this, arguments)

    // Describe plugin and inputs/outputs
    var self = this;
    this.desc = 'Decode an ambisonic spherical recording to headphones.';
    this.input_slots = [
                    { name: 'audio_in',
                    dt: core.datatypes.OBJECT,
                    desc: 'A 16-channel TOA audio stream to decode.',
                    def: null },
                    { name: 'buffer',
                    dt: core.datatypes.OBJECT,
                    desc: 'A 16-channel audio buffer containing binaural decoding filters.',
                    def: null }
                     ];
    this.output_slots = [
                { name: 'audio_out',
                  dt: core.datatypes.OBJECT,
                  desc: 'A 2-channel binaural audio stream for headphones.' }
                ];
    // Load external library
    core.add_aux_script('ambisonics/ambisonics.umd.js')
    .then(function() {

        // Initialize ambisonic nodes
        console.log(ambisonics);
        self.decoder_node = core.audioContext ? new ambisonics.binDecoder(core.audioContext, 3) : null;
    })
    .catch(function(err) {
        console.error(err.stack)
    });

    // internal vars
    this.src = null;
    this.buffer = null;
 
    this.first = true;

};

AmbisonicDecoderPlugin.prototype = Object.create(Plugin.prototype);


AmbisonicDecoderPlugin.prototype.reset = function() {
    this.first = true;
};
 
 
AmbisonicDecoderPlugin.prototype.update_input = function(slot, data) {
    switch(slot.name) {
        case 'audio_in':
            if (this.src) this.src.disconnect(0);
            this.src = data;
            if (data) {
                this.src.connect(this.decoder_node.in);
                this.decoder_node.out.player = data.player;
            }
            break;
        case 'buffer':
            this.buffer = data;
            if (data) {
                this.decoder_node.updateFilters(data);
                console.log('AmbiDecoder: Decoding filters updated');
            }
    }
};
 
 
AmbisonicDecoderPlugin.prototype.update_output = function(slot) {
    return this.decoder_node.out;
};
 
 
AmbisonicDecoderPlugin.prototype.update_state = function() {
    this.first = false;
};
 
})();
 