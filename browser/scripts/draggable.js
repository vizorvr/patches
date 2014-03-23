function draggable_mouseup(data) { return function(e)
{
	document.removeEventListener('mouseup', data.mouseup);
	document.removeEventListener('mousemove', data.mousemove);		
	data.stop(e);
	
	if(e.stopPropagation) e.stopPropagation();
	if(e.preventDefault) e.preventDefault();
	return false;
};}

function draggable_mousemove(data) { return function(e)
{
	var ui = data.ui[0];
	var nx = data.oleft + e.pageX - data.ox;
	var ny = data.otop + e.pageY - data.oy;
	var cp = E2.dom.canvas_parent;
	var co = cp.offset();
	
	if(e.pageX < co.left)
	{	
		cp.scrollLeft(cp.scrollLeft() - 20); 
		nx -= 20;
	}
	else if(e.pageX > co.left + cp.width())
	{	
		cp.scrollLeft(cp.scrollLeft() + 20); 
		nx += 20;
	}
	
	if(e.pageY < co.top)
	{
		cp.scrollTop(cp.scrollTop() - 20);
		ny -= 20;
	}
	else if(e.pageY > co.top + cp.height())
	{
		cp.scrollTop(cp.scrollTop() + 20);
		ny += 20;
	}

	nx = nx < 0 ? 0 : nx;
	ny = ny < 0 ? 0 : ny;
	
	ui.style.left = nx + 'px';
	ui.style.top = ny + 'px';
	
	data.oleft = nx;
	data.otop = ny;
	data.ox = e.pageX;
	data.oy = e.pageY;
	
	data.drag(e);
	
	if(e.stopPropagation) e.stopPropagation();
	if(e.preventDefault) e.preventDefault();
	return false;
};}

function draggable_mousedown(ui, drag, stop) { return function(e)
{
	if(!$(e.target).hasClass('t'))
		return true;

	var data = 
	{ 
		ui: ui,
		oleft: parseInt(ui[0].style.left) || 0,
		otop: parseInt(ui[0].style.top) || 0,
		ox: e.pageX || e.screenX,
		oy: e.pageY || e.screenY,
		drag: drag,
		stop: stop,
	};

	data.mouseup = draggable_mouseup(data);
	data.mousemove = draggable_mousemove(data);
	document.addEventListener('mouseup', data.mouseup);
	document.addEventListener('mousemove', data.mousemove);
	
	if(e.stopPropagation) e.stopPropagation();
	if(e.preventDefault) e.preventDefault();
	return false;
};}

function make_draggable(ui, drag, stop)
{
	ui[0].addEventListener('mousedown', draggable_mousedown(ui, drag, stop));
}

