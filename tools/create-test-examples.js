var fs = require('fs')
var mongoose = require('mongoose')
var when = require('when')

var graphFile = __dirname+'/../browser/data/graphs/default.json'
var graphData = fs.readFileSync(graphFile).toString('utf8')

var db, graphs, users

function rand() {
	return Math.floor(Math.random() * 10000)
}

function connect() {
	var dfd = when.defer()
	mongoose.connect('mongodb://localhost:27017/vizor')
	mongoose.connection.once('connected', function() {
		db = mongoose.connection.db
		db.collection('graphs', function(err, gc) {
			if (err) return dfd.reject(err)
			graphs = gc

			db.collection('users', function(err, uc) {
				if (err) return dfd.reject(err)
				users = uc

				dfd.resolve()
			})
		})
	})
	return dfd.promise
}

connect()
.then(function() {
	return users.findOne({username:'examples'})
	.then((user) => {
		if (user)
			return when.resolve(user)

		console.log('Creating test examples user')
		return users.insert({username:'examples'})
	})
})
.then(function(user) {
	return when.map([1, 2, 3, 4, 5], () => {
		return graphs.insert({
			private: false,
			rank: 0,
			deleted: false,
			editable: true,
			graph: graphData,
			path: rand(),
			name: rand(),
			owner: 'examples',
			_creator: user._id,
			previewUrlSmall: 'foo',
			previewUrlLarge: 'foo',
		})
	})
})
.then(function() {
	db.close()
})

