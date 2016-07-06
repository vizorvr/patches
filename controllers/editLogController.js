var EditLog = require('../models/editLog')

function EditLogController() {
}

EditLogController.prototype._canWrite = function(editLog, user) {
	var creator = editLog._creator

	if (!creator)
		return false;

	if (creator._id)
		creator = creator._id

	return !editLog ||
		creator.toString() === user.id.toString()
}

EditLogController.prototype.show = function(req, res, next) {
	EditLog.findOne({ name: req.params.channelName })
	.exec(function(err, editLog) {
		if (err)
			return next(err)

		return res.json(editLog)
	})
}

EditLogController.prototype.save = function(req, res, next) {
	var that = this
	var editLog

	function saveLog() {
		editLog.updatedAt = Date.now()
		editLog.save(function(err) {
			if (err)
				return next(err)

			res.json(editLog)
		})
	}

	EditLog.findOne({ name: req.params.channelName })
	.exec(function(err, exLog) {
		if (err)
			return next(err)

		if (exLog) {
			editLog = exLog

			if (!that._canWrite(editLog, req.user)) {
				return res.status(403)
					.json({message: 'Sorry, permission denied'})
			}

			editLog.readableName = req.body.readableName
			saveLog()
		} else {
			editLog = new EditLog(req.body)
			editLog.owner = req.user.username
			editLog.participants = [ req.user._id.toString() ]
	
			if (!editLog.readableName)
				editLog.readableName = editLog.channelName

			editLog._creator = req.user

			saveLog()
		}
	})
}

EditLogController.prototype.join = function(req, res, next) {
	EditLog.findOne({ name: req.params.channelName })
	.exec(function(err, exLog) {
		if (err)
			return next(err)

		exLog.addParticipant(req.user._id.toString())
		.then(function() {
			res.json({ ok: true })
		})
		.catch(next)
	})
}

EditLogController.prototype.userIndex = function(req, res, next) {
	EditLog.find({ participants: req.user._id.toString() })
	.exec(function(err, logs) {
		if (err)
			return next(err)

		res.json(logs)
	})
}

module.exports = EditLogController;
