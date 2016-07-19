(function() {

function undoItem(xi) {
	return xi.undo()
}

function redoItem(xi) {
	return xi.redo()
}

function UndoManager() {
	this.undoStack = []
	this.redoStack = []
	this._nestedTransactions = 0
}

UndoManager.prototype.isUndoable = function() {
	return this.undoStack.length > 0
}

UndoManager.prototype.isRedoable = function() {
	return this.redoStack.length > 0
}

UndoManager.prototype.getUndoStack = function() {
	return this.undoStack
}

UndoManager.prototype.getRedoStack = function() {
	return this.redoStack
}

UndoManager.prototype.begin = function(title) {
	this._nestedTransactions++

	if (this._transaction) { // xa already in progress, nop
		return;
	}

	var xa = {
		title: title,
		undoStack: []
	}

	xa.redo = function() {
		xa.undoStack.reverse().map(redoItem)
	}

	xa.undo = function() {
		xa.undoStack.reverse().map(undoItem)
	}

	this._transaction = xa
}

UndoManager.prototype.end = function() {
	if (--this._nestedTransactions > 0)
		return;

	var xa = this._transaction

	if (!xa)
		return;

	this._transaction = null

	this.push(xa)
}

UndoManager.prototype.execute = function(item) {
	this.push(item)
	return item.redo()
}

UndoManager.prototype.undo = function() {
	var item = this.undoStack.pop()

	if (!item)
		return;

	this.redoStack.push(item)

	return undoItem(item)
}

UndoManager.prototype.redo = function() {
	var item = this.redoStack.pop()

	if (!item)
		return;

	this.undoStack.push(item)

	return redoItem(item)
}

UndoManager.prototype.push = function(item) {
	this.redoStack = []

	if (this._transaction)
		return this._transaction.undoStack.push(item)

	this.undoStack.push(item)
}

if (typeof(module) !== 'undefined')
	module.exports = UndoManager
else
	window.UndoManager = UndoManager

})()