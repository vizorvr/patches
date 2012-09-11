var Notifier = new (function() 
{
	var self = this;

	this.apply_styles = function(element, style_object) 
	{
		for (var prop in style_object)
		    element.style[prop] = style_object[prop];
	};
	
	this.fade_out = function(element) 
	{
		if (element.style.opacity && element.style.opacity > 0.05) 
		    element.style.opacity = element.style.opacity - 0.05;
		else if (element.style.opacity && element.style.opacity <= 0.1 && element.parentNode)
			element.parentNode.removeChild(element);
		else 
		    element.style.opacity = 0.9;

		setTimeout(function() 
		{
		    self.fade_out.apply(this, [element]);
		}, 1000 / 30);
	};
	
	this.config = 
	{ 
		/* How long the notification stays visible */
		default_timeout: 5000,
		/* container for the notifications */
		container: document.createElement('div'),
		/* container styles for notifications */
		container_styles: {
		    position: "fixed",
		    zIndex: 99999,
		    right: "12px",
		    top: "12px"
		},
		/* individual notification box styles */
		box_styles: {
		    cursor: "pointer",
		    padding: "12px 18px",
		    margin: "0 0 6px 0",
		    backgroundColor: "#000",
		    opacity: 0.8,
		    color: "#fff",
		    font: "normal 13px 'Lucida Sans Unicode', 'Lucida Grande', Verdana, Arial, Helvetica, sans-serif",
		    borderRadius: "3px",
		    boxShadow: "#999 0 0 12px",
		    width: "300px"
		},
		/* individual notification box hover styles */
		box_styles_hover: {
		    opacity: 1,
		    boxShadow: "#000 0 0 12px"
		},
		/* notification title text styles */
		title_styles: {
		    fontWeight: "700"
		},
		/* notification body text styles */
		text_styles: {
		    display: "inline-block",
		    verticalAlign: "middle",
		    width: "240px",
		    padding: "0 12px"
		},
		/* notification icon styles */
		icon_styles: {
		    display: "inline-block",
		    verticalAlign: "middle",
		    height: "36px",
		    width: "36px"
		}
	};

	this.init = function()
	{
		var c = self.config;
		
		self.apply_styles(c.container, c.container_styles);
		document.body.appendChild(c.container);
	};

	this.notify = function(message, title, image) 
	{
		var c = self.config;
		var notification = document.createElement('div');

		self.apply_styles(notification, c.box_styles);

		notification.onmouseover = function() 
		{
			self.apply_styles(this, c.box_styles_hover);
		};
		
		notification.onmouseout = function() 
		{
			self.apply_styles(this, c.box_styles);
		};
		
		notification.onclick = function() 
		{
			this.style.display = 'none';
		};

		var icon = document.createElement('img');
		
		icon.src = image;
		self.apply_styles(icon, c.icon_styles);

		notification.appendChild(icon);

		var text = document.createElement('div');
		
		self.apply_styles(text, c.text_styles);
		notification.appendChild(text);

		if (title) 
		{
			var title_text = document.createElement('div');
			
			self.apply_styles(title_text, c.title_styles);
			title_text.appendChild(document.createTextNode(title));
			text.appendChild(title_text);
		}

		if (message) 
		{
			var message_text = document.createElement('div');
			
			message_text.appendChild(document.createTextNode(message));
			text.appendChild(message_text);
		}

		self.config.container.insertBefore(notification, c.container.firstChild);

		setTimeout(function() 
		{
			self.fade_out(notification);
		}, c.default_timeout);
	};
	
	this.info = function(message, title) 
	{
	    this.notify(message, title, "data:image/png;base64,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");
	};
	
	this.warning = function(message, title) 
	{
	    this.notify(message, title, "data:image/png;base64,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");
	};
	
	this.success = function(message, title) 
	{
	    this.notify(message, title, "data:image/png;base64,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");
	};
	
	this.error = function(message, title) 
	{
	    this.notify(message, title, "data:image/png;base64,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");
	};
})();
