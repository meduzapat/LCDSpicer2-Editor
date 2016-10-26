/**
 * Types definitions.
 */

var DEFAULT_SCREEN_DURATION	= 10;
var DEFAULT_TEXT_SPEED		= 50;
var DEFAULT_SCREEN_ROTATION	= 3;
var DEFAULT_TITLE			= "LCDSpicer2 Editor";
var DEFAULT_TICK			= 20;
var FILE_VERSION			= "2.1";

var widgetTypes = [
	"Text",
	"Bar",
	"Icon",
	"Bitmap",
	"Chart",
	"Clock"
];

var dataTypes = {
	0: 'Disabled',
	1: 'Boolean',
	2: 'Text',
	4: 'Percent',
	8: 'Date'
}

var rotations = [
	"No Rotation",
	"Random",
	"PingPong",
	"Carousel"
];

var outputObj = {
	Name		: "",
	Cycle		: 0,
	Direction	: 0,
	Screens		: []
}

// Empty screen.
var screenObj = {
	Name		: "",
	Duration	: DEFAULT_SCREEN_DURATION,
	Widgets		: [],
	Parameters	: []
};

//Empty Widget
var widgetObj = {
	Name		: "",
	Group		: "",
	X			: 1,
	Y			: 1,
	Width		: 1,
	Height		: 1,
	Type		: 0,
	Plugin		: "",
	Function	: 0,
	SubFunction	: 0,
	Data		: "",
	Symbol		: -1,
	Refresh		: 0
};

var units = {
	"Hertz" : {
		"None"		: -1, // NONE
		"Default"	: 0,
		"Hz"		: 1, // Hertz
		"kHz"		: 2, // kilohertz
		"mHz"		: 3, // megahertz
		"gHz"		: 4, // gigahertz
	},
	"Digital Information" : {
		"None"		: -1, // NONE
		"Default"	: 0,
		"B"			: 1, // Byte
		"KB"		: 2, // kibibyte
		"MB"		: 3, // mebibyte
		"GB"		: 4, // gibibyte
		"TB"		: 5, // tebibyte
		"PB"		: 6, // pebibyte
	}
};
