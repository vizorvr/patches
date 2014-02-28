var http = require('http');
var http = require('https');
var fs = require('fs');
var url = require('url');

if(process.argv.length < 3)
{
	console.log('Usage: node tinkercad-transcode.js <tinkercad ID>');
	process.exit();
}

tc_id = process.argv[2];

function getJSON(options, onResult)
{
    console.log("rest::getJSON");

    var prot = options.port == 443 ? https : http;
    
    var req = prot.request(options, function(res)
    {
        var output = '';
        console.log(options.host + ':' + res.statusCode);
        res.setEncoding('utf8');

        res.on('data', function (chunk) {
            output += chunk;
        });

        res.on('end', function() {
            var obj = JSON.parse(output);
            onResult(res.statusCode, obj);
        });
    });

    req.on('error', function(err) 
    {
        //res.send('error: ' + err.message);
    });

    req.end();
};

var options = {
	host: 'tinkercad.com',
	post: 443,
	path: '/things/' + tc_id + '/polysoup.json',
	method: 'GET',
	headers: {
		'Content-Type': 'application/json'
	}
};

getJSON(options, function(err, json)
{
	// console.log(json);
	var t = { };
	var bb = json.Bounds;
	
	t.id = tc_id;
	t.bounding_box = {};
	t.bounding_box.lo = [bb[0], bb[1], bb[2]];
	t.bounding_box.hi = [bb[3], bb[4], bb[5]];
	t.meshes = []
	
	var m = {};
	
	m.verts = json.Verts;
	m.indices = json.Tris;
	m.normals = json.Norms;
	
	t.meshes.push(m);
	
	console.log(JSON.stringify(t));
});
