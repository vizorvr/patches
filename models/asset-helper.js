var mongoose = require('mongoose');
var Schema = mongoose.Schema;

exports.schema = 
{
	_creator: { type: Schema.Types.ObjectId, ref: 'User' },
	name: { type: String, required: true, unique: true },
	slug: { type: String, index: true, unique: true },
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

exports.defaultView = function() {
	var json = {
		name: this.name,
		slug: this.slug,
		tags: this.tags,
		updatedAt: this.updatedAt,
		createdAt: this.createdAt,
		creator: this._creator.username
	};

	if (this.thumbnail)
		json.thumbnail = this.thumbnail;

	return json;
}

exports.preSaveSlugify = function(next)
{
	this.slug = exports.slugify(this.name);
	next();
}

exports.slugify = function(name)
{
	return name.toLowerCase()
		.replace(/[^\w-]+/g,'')
		.replace(/ +/g, '-');
}
