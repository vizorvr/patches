var Image = require('../models/image');
var AssetController = require('./assetController');

function ImageController(assetService)
{
	AssetController.apply(this, arguments);
};

ImageController.prototype = Object.create(AssetController.prototype);

// POST /image
// @override AssetController.prototype.save
ImageController.prototype.save = function(req, res, next)
{
	var that = this;

	this._service.canWrite(req.user, req.body.name)
	.then(function(can)
	{
		if (!can)
			return res.status(403).json({ msg: 'Permission denied' });

		return that._service
			.save(req.body, req.user)
			.then(function(image)
			{
				res.json(image.toJSON());
			});
	})
	.catch(function(err) { next(err); });
};

module.exports = ImageController;
