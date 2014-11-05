var mongoose = require('mongoose');
var Schema = mongoose.Schema;

exports.schema = 
{
	_creator: { type: Schema.Types.ObjectId, ref: 'User' },
	path: {
		type: String,
		required: true, 
		match:
		[
			/[\w0-9\-\_\/\.]/,
			'Path must be alphanumeric'
		],
		unique: true
	},
	url: { type: String, required: true },
	tags:
	[{
		type: String,
		match:
		[
			/[a-z0-9\-\_]/,
			'Tags must be alphanumeric'
		],
		index: true
	}],
	updatedAt: { type: Date, default: Date.now },
	createdAt: { type: Date, default: Date.now }
}

