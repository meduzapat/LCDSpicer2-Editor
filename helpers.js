/********************
 * Helper functions *
 ********************/

/**
 * Clones in deep an object.
 *
 * @param o object to clone.
 * @returns a clone of o
 */
function clone(o) {
	var output, v, key;
	output = Array.isArray(o) ? [] : {};
	for (key in o) {
		v = o[key];
		output[key] = (typeof v === "object") ? clone(v) : v;
	}
	return output;
}

/**
 * Generates a new id reusing previous not in use ones.
 *
 * @param stack
 * @returns {Number}
 */
function getNewId(stack) {
	var c = 1;
	while (true) {
		if (typeof stack[c] == "undefined") {
			return c;
		}
		c++;
	}
	// impossible to be here :)
}

/**
 * Marks the document dirty and sets the title.
 */
function setDirty() {
	if (isDirty)
		return;
	isDirty = true;
	setTitle(true);
}

/**
 * Cleans the dirty state and sets the title.
 */
function unSetDirty() {
	if (!isDirty)
		return;
	isDirty = false;
	setTitle();
}

/**
 * Clean up the app and leave it ready for a start over.
 */
function resetApplication() {

	$('#screenWidgets, #widgets, #outputScreens, #screens, #widgetType').html("");
	$('form')[0].reset();
	currentFileName		= "";
	isDirty				= false;
	callBackFunction	= null;
	outputs				= {};
	screens				= {};
	widgets				= {};
	if (jQuery.isEmptyObject(availableOutputs)) {
		toggleOutputsEditor(false);
		toggleScreensEditor(false);
		toggleWidgetsEditor(false);
	}
	else {
		populateOutputFields();
		populateScreenFields();
		populateWidgetFields();
		$('#output').change();
		toggleWidgetsEditor(false);
	}
	
	setTitle();
	updateCounters();
}

/**
 * Removes the screen by id (if exists) from an output.
 *
 * @param outputId the output
 * @param screenId the screen id to remove.
 */
function removeScreenFromOutput(outputId, screenId) {
	var index = outputs[outputId].Screens.indexOf(screenId);
	if (index != -1)
		outputs[outputId].Screens.splice(index, 1);
}

/**
 * Removes the widget by id (if exists) from a screen.
 *
 * @param screenId the screen.
 * @param widgetId the widget id.
 */
function removeWidgetFromScreen(screenId, widgetId) {

	var index = screens[screenId].Widgets.indexOf(widgetId);
	if (index != -1)
		screens[screenId].Widgets.splice(index, 1);
}

/**
 * Creates a new widget element inside the workspace.
 *
 * @param widgetId the id of the widget to generate.
 */
function createWidgetElement(widgetId) {
	// Add element to screen.
	screens[getSelectedScreenId()].Widgets.push(widgetId);

	// Setup workspace.
	populateWidgetFields();
	toggleWidgetsEditor(true);
	reDrawPreviewWidget(widgetId);
	populateLi(widgetId, widgets[widgetId].Name, screensWidgetsElement, 'widget');

	if ($('#widget' + widgetId).length == 0)
		populateGenericLi(widgetId, widgets[widgetId].Name, widgetsElement, 'widget');
	$('#widget' + widgetId).removeClass('unUsed');
	$('#widget' + widgetId).addClass('selected');

	$('#screenWidgets li:last-child').dblclick();
	screensWidgetsElement.scrollTop(screensWidgetsElement.prop('scrollHeight'));
}

/**
 * Creates a new screen element inside the workspace.
 *
 * @param screenId the id  of the screen to generate.
 */
function createScreenElement(screenId) {
	// Add element to output.
	outputs[getCurrentOutput()].Screens.push(screenId);

	// Setup workspace.
	populateScreenFields();
	toggleScreensEditor(true);
	populateLi(screenId, screens[screenId].Name, outputScreenElement, 'screen');

	if ($('#screen' + screenId).length == 0)
		populateGenericLi(screenId, screens[screenId].Name, screensElement, 'screen');
	$('#screen' + screenId).removeClass('unUsed');
	$('#screen' + screenId).addClass('selected');

	$('#addWidget').prop('disabled', false);
	$('#outputScreens li:last-child').dblclick();
	outputScreenElement.scrollTop(outputScreenElement.prop('scrollHeight'));
}

/**
 * Changes the application title to display that the editor need to be saved.
 *
 * @param status true set the status to dirty, false set it to clean.
 */
function setTitle(status) {

	var dirty = '';
	if (typeof status != 'undefined' && status == true) {
		dirty = '*';
	}
	$('title').text(DEFAULT_TITLE + ' ' + currentFileName + dirty);
}

/**
 * Adds a message entry on the message area.
 *
 * @param message a text to display.
 * @param type (normal or error).
 */
function messageAdd(message, type) {
	if (typeof type == "undefined") {
		type = 'normal';
	}
	var li = $('<li/>');
	li.attr('class', type).text(message);
	$('#messagesDisplay').append(li);
	if ($('#messagesDisplay li').length > 30) {
		$('#messagesDisplay li:first').remove();
	}
	$('#messagesDisplay').scrollTop($('#messagesDisplay').prop('scrollHeight'));
}

/**
 * Converts seconds into elapsed time
 *
 * @param seconds
 * @returns {String} the text representing the elapsed time.
 */
function secondsToElapsedTime(seconds) {
	var time = "";
	var goes = false;
	var day = 0;
	var hou = 0;
	var min = 0;

	// Days.
	day = parseInt(seconds / 86400);
	if (day) {
		time += day + " Day";
		goes = true;
		if (day != 1)
			time += "s";
	}
	if (goes)
		time += " ";
	seconds = seconds % 86400;

	// Hours.
	hou = parseInt(seconds / 3600);
	if (goes || hou) {
		goes = true;
		time += hou + " Hour";
		if (hou != 1)
			time += "s";
	}
	if (goes)
		time += " ";
	seconds = seconds % 3600;

	// Minutes.
	min = parseInt(seconds / 60);
	if (goes || min) {
		time += min + " Min";
		goes = true;
		if (min != 1)
			time += "s";
	}
	if (goes)
		time += " ";

	// Seconds.
	seconds = seconds % 60;
	time += seconds + " Sec";
	if (seconds != 1)
		time += "s";

	return time;
}

/**
 * Convert Ticks into elapsed time.
 *
 * @param ticks, the number of ticks to calculate.
 * @return a string with the time representation.
 */
function ticksToElapsedTime(ticks) {
	var text = "";
	seconds = parseInt(ticks / DEFAULT_TICK);
	if (seconds > 0)
		text = secondsToElapsedTime(seconds);

	var remains = (ticks % DEFAULT_TICK);
	if (text.length > 0 && remains)
		text += " + "
	if (remains)
		text += remains + "/" + DEFAULT_TICK + " Secs";
	return text;
}

/**
 * Returns the id of a widget type
 *
 * @returns the widget id or 0 if not found.
 */
function getWidgetTypeId(widget) {
	for (var id in widgetTypes) {
		if (id == widget)
			return id;
	}
	return 0;
}

/**
 * Returns the current using output plugin.
 *
 * @return the output name.
 */
function getCurrentOutput() {
	return $('#output').val();
}

/**
 * Returns the screen id for the current screen.
 *
 * @returns the screen id or 0 if none.
 */
function getSelectedScreenId() {
	if ($('#outputScreens li.selected').length)
		return parseInt($('#outputScreens li.selected').data('id'));
	return 0;
}

/**
 * Returns the widget id for the current widget.
 *
 * @returns the widget ID or 0 if none.
 */
function getSelectedWidgetId() {
	if ($('#screenWidgets li.selected').length)
		return parseInt($('#screenWidgets li.selected').data('id'));
	return 0;
}

/**
 * Updates the counters on every container based on the number of elements it holds.
 */
function updateCounters() {
	elements = [outputScreenElement, screensElement, screensWidgetsElement, widgetsElement];
	for (element in [outputScreenElement, screensElement, screensWidgetsElement, widgetsElement]) {
		var counter = $('li', elements[element]).length;
		$('.counter', elements[element].next()).text(counter);
	}
	refreshUnUsed();
}

/**
 * Clean up unused widgets and screens.
 */
function refreshUnUsed() {
	$('#screens li, #widgets li').addClass('unUsed');
	for (var output in outputs) {
		for (var screenPos in outputs[output].Screens) {
			var screenId = outputs[output].Screens[screenPos];
			$('#screen' + screenId).removeClass('unUsed');
			for (var widgetPos in screens[screenId].Widgets) {
				var widgetId = screens[screenId].Widgets[widgetPos];
				$('#widget' + widgetId).removeClass('unUsed');
			}
		}
	}
}

/**
 * Simulates a progress bar value.
 *
 * @param element a bar element
 * @returns interval object.
 */
function progressSimulation(type, element, refresh) {
	return window.setInterval(function() {
		if (type == widgetTypes.indexOf('Bar')) {
			var maxWidth = element.width();
			var child = $('.progressBar', element);
			var currentWidth = child.width() + (Math.random() * 16 - 6);
			child.css('width', currentWidth + 'px');
			if (currentWidth > maxWidth)
				child.css('width', 0 + 'px');
		}
		else {
			var d = new Date();
			element.html(Math.floor(d.getTime() / 100));
			$('#soItemScrollspeed').trigger('change');
		}
	}, refresh * 50);
}

/**
 * Merges a list of keys and values.
 *
 * @param keys they key list
 * @param values can be a single value or a list of them.
 * @returns {___anonymous_obj}
 */
function fillObject(keys, values) {

	obj = {};
	for (key in keys)
		if (typeof values == 'object') {
			if (typeof values[key] != "undefined")
				obj[keys[key]] = values[key];
			else
				obj[keys[key]] = '';
		}
		else{
			obj[keys[key]] = values;
		}
	return obj;

}

/**
 * Returns the available widget types supported by an output.
 *
 * @param output the output name
 * @returns {Array}
 */
function getOutputWidgetTypes(output) {
	var types = [];
	for (var type in availableOutputs[output]['widgets']) {
		types[type] = widgetTypes[type];
	}
	return types;
}

function checkOutputRules(output, widgetType, rule) {
	return availableOutputs[output]['widgets'][widgetType][rule];
}

function createParameterElement(name, parameter) {

	if (!parameter.type)
		return;

	var id = 'soItem' + name.replace(/\s/g, '');
	var element = $('<div class="formElement"><label for="' + id + '">' + name + '</label></div>');
	var newInput;

	switch (parameter.type) {

	case 1: // boolean
		element.append($('<input type="checkbox" value="true" id="' + id + '" name="so_' + name + '" />'));
		break;

	case 2: // text
		var formElement = $('<select  id="' + id + '" name=so_"' + name + '"/>');
		for (var value in parameter.values) {
			formElement.append($('<option value="' + value + '">' + parameter.values[value] + '</option>'));
		}
		element.append(formElement);
		break;

	case 4: // percent
		element.append($('<input type="number" min="0" max="100" value="50" id="' + id + '" name="so_' + name + '" />'));
		break;

	case 8: // date
		element.append($('<input type="date" value="" id="' + id + '" name="so_' + name + '" />'));
		break;
	}
	
	newInput = $('input', element);
	// special cases
	if (name == 'Scroll speed') {
		newInput.attr('type', 'range').attr('step',5);
	}
	
	$('#outputOptions').append(element);
}