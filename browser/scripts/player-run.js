function play()
{
  $('#fs').click(function()
  {
    E2.app.player.core.renderer.set_fullscreen(true);
  });

  var url = $('canvas[data-graph-url]').data('graph-url');
  E2.app.player.core.asset_tracker.add_listener(progress);
  E2.app.player.load_from_url(url);
  E2.app.player.play();
}

function EnumerateVRDevices(devices)
{
  var hmd = null, sensor = null;

  for(var i = 0; i < devices.length; i++)
  {
    if(devices[i] instanceof HMDVRDevice)
    {
      // Just use the first device we find for now.
      hmd = devices[i];
      break;
    }
  }

  if(hmd)
  {
    for(var i = 0; i < devices.length; i++)
    {
      var d = devices[i];

      if(d instanceof PositionSensorVRDevice && d.hardwareUnitId === hmd.hardwareUnitId)
      {
        sensor = devices[i];
        break;
      }
    }
  }

  CreatePlayer([hmd, sensor], play);
}

$(document).ready(function()
{
  if(navigator.getVRDevices)
  {
    navigator.getVRDevices().then(EnumerateVRDevices);
  }
  else if(navigator.mozGetVRDevices)
  {
    navigator.mozGetVRDevices(EnumerateVRDevices);
  }
  else
  {
    CreatePlayer([null, null], play);
  }
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

