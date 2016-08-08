if (typeof VizorUI === 'undefined')
	var VizorUI = {}

if (typeof uiEvent === 'undefined')
	uiEvent = {}

uiEvent.xhrFormSuccess	= 'xhrFormSuccess'		//	dispatched on document
uiEvent.xhrFormUIReset	= 'xhrFormUIReset'		//	dispatched on form

/**
 * enables a form to submit and process its response via xhr call
 * validation is done in backend
 * @param $form
 * @param onSuccess
 */
VizorUI.setupXHRForm = function($form, onSuccess) {	// see views/account/signup for example

	if ($form.length !== 1)
		return console.error('must call with exactly 1 form')

	var xhrEnabled = $form.data('xhrenabled')
	if (xhrEnabled) {
		msg("ERROR: setupXHRForm but form already enabled " + $form.attr('id'))
		return false
	}

	var hasFiles = $form.length && ($form[0].querySelectorAll('input[type="file"]').length > 0)

	if (typeof onSuccess !== 'function') {
		onSuccess = function(response) {
			if (response && (typeof response.redirect !== 'undefined') && (response.redirect)) {
				window.location.href = response.redirect
				return
			}
			// append a message to form
			var message = jQuery('<p></p>')
							.text(response.message)
							.addClass('xhr success message')
			$form.append(message)
			$form.find(':focus').trigger('blur')

			var detail = {
				id: 		$form.attr('id'),
				response: 	response
			}
			var successEvent = new CustomEvent(uiEvent.xhrFormSuccess, {detail: detail});
			document.dispatchEvent(successEvent)
		}
	}

	$form.find('input, textarea').each(function(){
		var $this = jQuery(this)
		var placeholder = $this.attr('placeholder')
		var required = $this.hasClass('required')
		var had_error = false
		var had_error_value = false
		if (placeholder) {
			if (required) placeholder += '*'
			$this.attr('placeholder', placeholder)
			$this.on('focus', function(){
				had_error = $this.parent().hasClass('error')
				had_error_value = (had_error) ? $this.val() : false
				$this.parent().removeClass('error').find('span.message').html('')
				$this.addClass('in_focus')
				// ux
				//	$this.data('placeholder', placeholder);
				//	$this.attr('placeholder', '');
				return true
			});

			$this.on('blur', function(){
				// ux
				//	$this.attr('placeholder', $this.data('placeholder'));
				$this.removeClass('in_focus')
				if (required && had_error &&
					(($this.val() === '') || ($this.val() === had_error_value)) ) {
					// then
						$this.parent().addClass('error')
				}
				return true
			})
		}
	})


	var inProgress = false
	var $body = jQuery(document.body)
	$form
		.removeClass('hasMessage')
		.addClass('noMessage')


	var $unknownError = jQuery('#unknown_error', $form)
		if ($unknownError.length < 1)
			$unknownError = jQuery('.genericError', $form)

	var resetUIstate = function() {
		$form
			.attr('data-lastresult', null)
			.attr('data-laststatus', null)

		$form.not('.keepMessage')
			.removeClass('hasMessage')
			.addClass('noMessage')

		$form.find('p.xhr.success.message').remove()
		$form.find('span.message').html('')
		$form.find('div.form-input').removeClass('error')

		if (!$form.hasClass('keepMessage'))
			$unknownError.html('').hide()

		$form[0].dispatchEvent(new CustomEvent(uiEvent.xhrFormUIReset))
	}

	var bindResetUIOnInputAfterResponse = function() {
		var inputs = $form[0].querySelectorAll('input,textarea')
		var other = $form[0].querySelectorAll('select, input[type="radio"]')

		var resetAndRemove = function() {
			resetUIstate()
			Array.prototype.forEach.call(inputs, function(el) {
				el.removeEventListener('input', resetAndRemove)
			})
			Array.prototype.forEach.call(other, function(el) {
				el.removeEventListener('change', resetAndRemove)
			})
		}
		Array.prototype.forEach.call(inputs, function(el){
			el.addEventListener('input', resetAndRemove)
		})
		Array.prototype.forEach.call(other, function(el){
			el.addEventListener('change', resetAndRemove)
		})
	}

	if (hasFiles) {
		var iframe
		var action = $form.attr('action')
		if (action && (action.indexOf('ajax=1') === -1)) {
			action += (action.indexOf('?') > -1) ? '&ajax=1' : '?ajax=1'
			$form.attr('action', action)
		}

		// http://stackoverflow.com/a/36976807
		if (!$form.attr('target')) {
			//create a unique iframe for the form
			var d = new Date()
			while (new Date().getTime() === d.getTime()) {}	// block till next millisecond
			var iframeName = 'xhrf_' + d.getTime()
			iframe = $("<iframe></iframe>")
				.attr('name', iframeName)
				.hide()
				.insertAfter($form)
			$form.attr('target', iframeName)
		}

		iframe = iframe || $('iframe[name=" ' + $form.attr('target') + ' "]')
		iframe.load(function () {
			bindResetUIOnInputAfterResponse()
			//get the server response
			inProgress = false
			$body.removeClass('loading')
			$form.removeClass('loading')
			if (onSuccess) {
				var response = iframe.contents().find('body').text()
				try {
					response = JSON.parse(response)
				}
				catch (e) {
					console.error('got no json', response, e)
				}
				onSuccess(response)
			}
		})

	}

	$form.submit(function(event) {

		if (inProgress) return false

		// future decision on forms without this set
		var actionURL = $form.attr('action')
		if (!actionURL) return true

		resetUIstate()
		
		inProgress = true
		$body.addClass('loading')
		$form.addClass('loading')

		if (hasFiles)
			return true
			// already handled by redirecting form submit to target iframe created above

		event.preventDefault()
		var formData = $form.serialize()

		jQuery.ajax({
			type:	'POST',
			url:	actionURL,
			data:	formData,
			dataType: 'json',
			cache: false,
			error: function(err) {
				inProgress = false
				var detail = {}
				$body.removeClass('loading')
				$form
					.removeClass('loading')
					.attr('data-lastresult', 'error')
					.attr('data-laststatus', err.status)

				bindResetUIOnInputAfterResponse()
				if (err.responseJSON) {
					var json = err.responseJSON
					var errors
					// best case expect err.responseJSON.errors[{msg:'',param:'',value:''}, ...]
					if (json.errors instanceof Array) {
						errors = json.errors
					} // exceptions follow
					else if (json instanceof Array) {
						// validation returns array, but some simple responses only have message
						errors = json
						msg("ERROR: #596 lazy format error")
						console.log(errors)
					}
					else if (json.error && json.error.errors){	// graphController
						errors = []
						var ers = json.error.errors
						for (var key in ers) {
							if (ers.hasOwnProperty(key)) {
								errors.push({
									param: key,
									msg: ers[key].message
								})
							}
						}
					}
					else if (json.error && json.error.status) {
						errors = [json.error]
					}
					else {
						msg("ERROR: #596 lazy format error")
						console.log(json)
						errors = [{
							param:	json.param || '',
							msg:	json.message
						}]
					}
					errors.map(function(ei) {
						var $field = $form.find('#f_'+ei.param.replace('[','_').replace(']','_'))

						if (ei.param && (ei.msg || ei.message) && ($field.length>0)) {
							$field.addClass('error')
								.find('span.message').html(ei.msg || ei.message)
						} else {
							// in case no 'param' comes back
							$unknownError.html($unknownError.html() + '<span>'+ (ei.msg || ei.message) + '</span>').show()
						}
					})
					if (!errors.length) {	// should errors be empty
						$unknownError.html($unknownError.html() + '<span>'+ (json.message) + '</span>').show()
					}
					detail = {
						errors: errors,
						json: json
					}
				} else {
					if (err.status === 200) {	// the response was deemed an error but has good status (jQuery timeout / last resort)
						$unknownError.html('<span>The server said: (' + err.status + '): ' + err.statusText +'</span>').show()
					} else {
						// in case no json comes back, e.g. just a code
						$unknownError.html('<span>An error ('+err.status+') occurred. Please check all required fields</span>').show()
					}
					detail = {
						err: err
					}
				}
				$form[0].dispatchEvent(new CustomEvent('xhrerror', {detail:detail}))
				$form
					.removeClass('noMessage')
					.addClass('hasMessage')
			},
			success: function(content, textStatus, jqxhr) {
				inProgress = false
				$body.removeClass('loading')
				$form
					.removeClass('loading')
					.attr('data-lastresult', 'success')
					.attr('data-laststatus', jqxhr.status)

				bindResetUIOnInputAfterResponse()
				onSuccess.apply(this,arguments)
			}

		})
		return false
	})

	resetUIstate()
	$form.attr('data-xhrenabled', 'true')

}