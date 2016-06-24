var accountUI = function accountUI() {
	this.init()
}

accountUI.prototype.init = function() {
	E2.track({event: 'profilePage'})

	if (document.body.classList.contains('bProfile'))
		this.initProfilePage()
	
}

accountUI.prototype.initProfilePage = function() {
	var avatarPreviewImg = document.querySelector('#avatarUploadForm img.avatar')
	var headerPreviewDiv = document.querySelector('#headerUploadForm div.user-header')

	this.initCollapsibleToggles()

	var passwordInput = document.getElementById('passwordinput')
	var passwordForm = passwordInput.form
	var passwordMeter = passwordForm.getElementsByTagName('meter')[0]
	var strengthFunction = null	// todo: add strength function
	this.passwordStrengthMeter(passwordInput, passwordMeter, strengthFunction)

	E2.models.user.on('change', function(model){
		var profile = model.changed.profile
		if (profile) {
			avatarPreviewImg.src = profile.avatar || model.get('gravatar')
			headerPreviewDiv.style.backgroundImage = "url("+profile.header+")"
		}
	})

	document.addEventListener(uiEvent.xhrFormSuccess, function(e){
		if (!e.detail.response)
			return

		var response = e.detail.response
		if (response.data && response.data.uploaded)
			E2.models.user.set(response.data.user)
		else
			E2.models.user.set(response.data)
	})


	var publicPrivateLabel = document.getElementById('publishPublicPrivateLabel')
	var publicPrivateCheckbox = document.getElementById('publishDefaultPublicToggle')
	publicPrivateCheckbox.addEventListener('change', function(e) {
			publicPrivateLabel.innerHTML = this.checked ? 'Public' : 'Private'
		})
	publicPrivateLabel.innerHTML = publicPrivateCheckbox.checked ? 'Public' : 'Private'

}


// strengthFunction returns values 0 - 5
// <meter max="5" min="0" low="2" high="4" optimum="5">
accountUI.prototype.passwordStrengthMeter = function(input, meter, strengthFunction) {
	strengthFunction = strengthFunction || function (pw) {var min=5, len = pw.length - min; return (len>5) ? 5 : len; }
	input.addEventListener('input', function(){
		meter.value = strengthFunction(this.value)
	})
}

accountUI.prototype.initCollapsibleToggles = function() {
	var toggles = document.querySelectorAll('section.collapsible a.toggle')
	if (!toggles.length)
		return

	var forEach = Array.prototype.forEach
	var cancel = function(e){
		e.preventDefault()
		e.stopPropagation()
		return false
	}
	forEach.call(toggles, function(a){
		a.addEventListener('click', function(e) {
			var section = a.parentElement.parentElement
			var isCollapsed = section.classList.contains('collapsed')

			section.classList.toggle('collapsed', !isCollapsed)
			// todo: scrollto
			return cancel(e)
		})
		a.addEventListener('contextmenu', cancel)
	})
}

document.addEventListener('DOMContentLoaded', function() {
	if (!E2.ui)
		E2.ui = {}

	E2.ui.account = new accountUI()
})