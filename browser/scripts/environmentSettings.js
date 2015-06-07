// environment settings

function EnvironmentSettings()
{
	this.fog = {
		enabled: false,
		bottom_color: vec4.createFrom(1, 1, 1, 1),
		bottom_height: 0.0,
		top_color: vec4.createFrom(1, 1, 1, 1),
		top_height: 10.0,

		horiz_distance: 10.0,
		horiz_steepness: 1.0,

		vert_steepness: 1.0
	};
};

