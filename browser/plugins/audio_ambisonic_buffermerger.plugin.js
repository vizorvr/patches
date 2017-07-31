(function(){

var AmbisonicBufferMerger = E2.plugins.audio_ambisonic_buffermerger = function(core, node) {
    Plugin.apply(this, arguments)

    // Describe plugin and inputs/outputs
    var self = this;
    this.desc = 'Decode an ambisonic spherical recording to headphones.';
    this.input_slots = [
                    { name: 'buffer1',
                    dt: core.datatypes.OBJECT,
                    desc: 'The first 8ch audio buffer.',
                    def: null },
                    { name: 'buffer2',
                    dt: core.datatypes.OBJECT,
                    desc: 'The second 8ch audio buffer.',
                    def: null },
                    { name: 'filetype',
                    dt: core.datatypes.FLOAT,
                    desc: 'Audio file format: 0:WAV, 1:OGG.',
                    def: null }
                        ];
    this.output_slots = [
                { name: 'buffer12',
                  dt: core.datatypes.OBJECT,
                  desc: 'The 16ch combined buffer.' }
                ];

    // internal vars
    this.context = core.audioContext;
    this.filetype = null;
    this.buffer1 = null;
    this.buffer2 = null;
    this.buffer12 = null;
 
    this.first = true;
};

AmbisonicBufferMerger.prototype = Object.create(Plugin.prototype);


AmbisonicBufferMerger.prototype.reset = function() {
    this.first = true;
};
 
 
AmbisonicBufferMerger.prototype.update_input = function(slot, data) {
    switch(slot.name) {
        case 'buffer1':
            this.buffer1 = data;
            if (data && this.buffer2) {
                this.buffer12 = this.mergeBuffers(data, this.buffer2, this.filetype);
                console.log('Buffer 1 updated.');
            }
            break;
        case 'buffer2':
            this.buffer2 = data;
            if (data && this.buffer1) {
                this.buffer12 = this.mergeBuffers(this.buffer1, data, this.filetype);
                console.log('Buffer 2 updated.');
            }
            break;
        case 'filetype':
            switch(data) {
                case 0:
                    this.filetype = "wav";
                    console.log('Channel mapping during loading set for WAV files.');
                    break;
                case 1:
                    this.filetype = "ogg";
                    console.log('Channel mapping during loading set for OGG files.');
                }
    }
};
 
 
AmbisonicBufferMerger.prototype.update_output = function(slot) {
    return this.buffer12;
};
 
AmbisonicBufferMerger.prototype.update_state = function() {
    this.first = false;
};

AmbisonicBufferMerger.prototype.mergeBuffers = function(buffer1, buffer2, filetype) {
    var srate1 = buffer1.sampleRate;
    var srate2 = buffer2.sampleRate;
    if (srate1 == srate2) {
        var nCh1 = buffer1.numberOfChannels;
        var nCh2 = buffer2.numberOfChannels;
        var length = buffer1.length;
        length = Math.max(length, buffer2.length);
 
        // If the 8-ch audio file is OGG, then remap 8-channel files to the correct
        // order cause Chrome and Firefox messes it up when loading. Other browsers have not
        // been tested with OGG files. 8ch Wave files work fine for both browsers.
        var remap8ChanFile = [1,2,3,4,5,6,7,8];
        if (filetype == "wav") {
             console.log("WAV file channel mapping: [1,2,3,4,5,6,7,8]");
        } // normal for wav
        else if (filetype == "ogg") {
             console.log("OFF file channel mapping: [1,3,2,7,8,5,6,4]");
             remap8ChanFile = [1,3,2,7,8,5,6,4];
             //remap8ChanFile = [1,3,2,8,6,7,4,5];
        }
 
        var buffer12 = this.context.createBuffer(nCh1+nCh2, length, srate1);
        for (var j = 0; j < nCh1; j++) {
            buffer12.getChannelData(j).set(buffer1.getChannelData(remap8ChanFile[j]-1));
        }
        for (var j = 0; j < nCh2; j++) {
            buffer12.getChannelData(nCh1+j).set(buffer2.getChannelData(remap8ChanFile[j]-1));
        }
        return buffer12;
    }
};
 
})();
 
