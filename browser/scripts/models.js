(function()
{
	window.User = Backbone.Model.extend({});
	window.FileList = Backbone.Model.extend(
	{
		initialize: function()
		{
			this._items = [];
			this.set('files', this._items);
		},

		addFile: function(file)
		{
			var files = [file];
			this._items = files.concat(this.get('files'));
			this.set('files', this._items);
		},

		setFiles: function(files)
		{
			this._items = files;
			this.set('files', this._items);
		},

		filterByTags: function(tags)
		{
			if (!tags)
			{
				this.set('files', this._items);
				return;
			}

			var filtered = this._items.filter(function(file)
			{
				return tags.every(function(tag)
				{
					return file.tags.indexOf(tag) > -1;
				});
			});

			this.set('files', filtered);
		}
	});
})()