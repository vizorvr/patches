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
			'Tags must be alphanumeric and lowercase'
		],
		index: true
	}],
	updatedAt: { type: Date, default: Date.now },
	createdAt: { type: Date, default: Date.now }
}

exports.slugify = function slugify(name)
{
	return name.toLowerCase()
		.replace(/[^\w-]+/g,' ')
		.replace(/ +/g, '-');
};
