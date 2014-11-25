function play()
{
	E2.app.player.play();
}

function load()
{
	$('#fs').click(function()
	{
		E2.app.player.core.renderer.set_fullscreen(true);
	});

	var url = $('canvas[data-graph-url]').data('graph-url');
	E2.app.player.core.asset_tracker.add_listener(progress);
	E2.app.player.load_from_url(url);
}

function findVrDevices(devices)
{
	var hmd = null, sensor = null;

	devices.some(function(device)
	{
		if (device instanceof HMDVRDevice)
		{
			// Just use the first device we find for now.
			hmd = device;
			return true;
		}
	});

	if(hmd)
	{
		devices.some(function(d)
		{
			if (d instanceof PositionSensorVRDevice && d.hardwareUnitId === hmd.hardwareUnitId)
			{
				sensor = d;
				return true;
			}
		});
	}

	CreatePlayer([hmd, sensor], load);
}

$(document).ready(function()
{
	if(navigator.getVRDevices)
		navigator.getVRDevices().then(findVrDevices);
	else if(navigator.mozGetVRDevices)
		navigator.mozGetVRDevices(findVrDevices);
	else
		CreatePlayer([null, null], load);
});

function progress()
{
	var at = E2.app.player.core.asset_tracker;
	var $progress = $('.progress-bar');
	var pct = Math.floor(((at.failed + at.completed) / at.started) * 100);
	$('.progress').show();
	if (pct === 100)
		$('.progress').hide();
	$progress.css('width', pct + '%');
}

