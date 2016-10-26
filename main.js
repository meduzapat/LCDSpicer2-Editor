/**
 * Main javascript file
 */

var outputs				= {};
var screens				= {};
var widgets				= {};
var currentFileName		= "";
var isDirty				= false;
var callBackFunction	= null;
var randomizers			= {};

var outputScreenElement;
var screensElement;
var screensWidgetsElement;
var widgetsElement;

$(function() {

	outputScreenElement		= $('#outputScreens');
	screensElement			= $('#screens')
	screensWidgetsElement	= $('#screenWidgets');
	widgetsElement			= $('#widgets');

	/**
	 * Check if the detect file is loaded.
	 * At this point the program is not usable.
	 */
	if (typeof availableInputs == 'undefined') {
		$('#detectMissingDialog').dialog('open');
		return;
	}
	
	/**
	 * Opens the options menu.
	 */
	$('#optionsButton').click(function(event) {
		event.stopPropagation();
		$('#mainMenu').toggle();
	});

	/**
	 * Closes open stuff when clicking somewhere else.
	 */
	$("body").click(function() {
		if ($('#mainMenu').is(':visible')) {
			$('#mainMenu').hide();
		}
	});

	/******************
	 * Outputs editor *
	 ******************/

	// Initialize.
	if (jQuery.isEmptyObject(availableOutputs)) {
		messageAdd('Unable to find any output.', 'error');
	}
	else {
		populateSelect($('#output'), fillObject(Object.keys(availableOutputs), Object.keys(availableOutputs)));
	}
	$('#rotationReverse').button();
	
	// Time spinner for rotate screen.
	$('#rotation').change(function() {
		if ($(this).val() < 2)
			$('#rotationReverse').attr('disabled', true);
		else
			$('#rotationReverse').attr('disabled', false);
		$('#rotationReverse')
			.attr('checked', false)
			.button("refresh");
	});

	// Output selector.
	$('#outputEditor').on('change', '#output', function() {

		$('#screenWidgets, #outputScreens').html("");
		$('#screens li.selected').removeClass('selected');
		var id = getCurrentOutput();

		if (typeof outputs[id] == 'undefined') {
			if (typeof availableOutputs[id] == 'undefined') {
				console.error('Invalid output ' + id);
				return false;
			}
			outputs[id] = clone(outputObj);
		}

		if (outputs[id].Screens.length) {
			populateScreenFields();
			toggleScreensEditor(true);
			for (var screenPos in outputs[id].Screens) {
				var screenId = outputs[id].Screens[screenPos];
				populateLi(screenId, screens[screenId].Name, outputScreenElement, 'screen');
				$('#screen' + screenId).addClass('selected');
			}
			// Allow widgets to be created.
			$('#addWidget').prop('disabled', false);
			// Allow widgets to be added.
			$('#widgets li.dontAdd').removeClass('dontAdd');
			$('#outputScreens li:first-child').dblclick();
		}
		else {
			toggleScreensEditor(false);
			// Avoid widgets to be created.
			$('#addWidget').prop('disabled', true);
			// Avoid widgets to be added.
			$('#widgets li')
				.addClass('dontAdd')
				.removeClass('selected');
			createPreviewScreen();
		}
	});

	/******************
	 * Screens editor *
	 ******************/

	// Add new Screen
	$('#addScreen').click(function() {
		var screenId = getNewId(screens);
		screens[screenId] = clone(screenObj);
		createScreenElement(screenId);
		$('#widgets li.dontAdd').removeClass('dontAdd');
	});

	// Screen name.
	$('#screenName').on('blur change', function() {

		var screenId = getSelectedScreenId();

		if (!screenId)
			return;

		var screenName = $(this).val();
		if (screens[screenId].Name == screenName)
			return;

		screens[screenId].Name = screenName;
		$('#outputScreens li.selected span, #screen' + screenId + ' span')
			.text(screenName)
			.attr('title', screenName);
	});

	// Duration spinner
	$('#screenDuration').change(function() {

		var screenId = getSelectedScreenId();
		if (!screenId)
			return;

		var duration = $(this).val();
		if (duration > 0)
			$('#screenDurationTime').text(secondsToElapsedTime(duration));
		else
			$('#screenDurationTime').text('Disabled');

		screens[screenId].Duration = duration;
	});

	// Select screen to edit.
	outputScreenElement.on('dblclick', 'li', function() {
		selectScreen(this);
	});

	/******************
	 * Widgets editor *
	 ******************/

	// Add new Widget.
	$('#addWidget').click(function() {
		var widgetId = getNewId(widgets);
		widgets[widgetId] = clone(widgetObj);
		createWidgetElement(widgetId);
	});

	// Widget name auto generation.
	$('#generateWidgetName').click(function() {

		var name = "";

		if ($('#widgetPlugin').text() != 'None') {
			name = $('#widgetPlugin').text() + ":" + $('#widgetSourceLabel').text();
			if ($('#widgetElement').val() != null) {
				if ($('#widgetElement').val() == "custom-value") {
					name += ":" + $('#widgetData').val();
				}
				else {
					name += ":" + $('#widgetElement option:selected').text();
				}
			}
		}
		else {
			name = 'Label:' + $('#widgetData').val();
		}
		$('#widgetName')
			.val(name)
			.trigger('blur');
	});

	// when widgetType changes.
	$('#widgetEditor').on('change', '#widgetType', function() {

		var widgetId = getSelectedWidgetId();

		if (!widgetId)
			return;

		var widgetData = clone(widgetObj);
		var type = parseInt($(this).val());
		widgetData.Type = type;
		widgets[widgetId] = widgetData;
		populateWidgetFields(widgetData);
		reDrawPreviewWidget(widgetId, true);
	});

	// Refresh spinner
	$('#widgetRefresh').change(function() {

		var widgetId = getSelectedWidgetId();
		if (!widgetId)
			return;

		var refresh = $(this).val();
		if (refresh > 0)
			$('#widgetRefreshTime').text(ticksToElapsedTime(refresh));
		else
			$('#widgetRefreshTime').text('Disabled');

		widgets[widgetId].Refresh = refresh;
		reDrawPreviewWidget(widgetId, true);
	});

	// Data handler.
	$('#widgetEditor').on('change', '#widgetElement', function() {
		if ($(this).val() == "custom-value") {
			$('#widgetData')
				.val("")
				.parent()
				.removeClass('hidden')
				.focus();
		}
		else {
			$('#widgetData')
				.val($(this).val())
				.parent()
				.addClass('hidden');
		}
	});

	// Input picket.
	$('#inputPicker').click(function() {
		$('#inputDialog').dialog('open');
	});

	// Values change.
	$('#widgetEditor input').on('change blur', function() {

		var widgetId = getSelectedWidgetId();
		if (!widgetId)
			return;

		var destination = $(this).attr('name');
		var data = $(this).val();

		if (destination == 'Refresh') {
			return;
		}

		if (widgets[widgetId][destination] == data)
			return;

		widgets[widgetId][destination] = data;
		if (destination == 'Name') {
			$('#screenWidgets li.selected span, #widget' + widgetId + ' span')
				.text(data)
				.attr('title', data);
		}
		if (destination == 'Refresh') {

		}

		if (destination == 'X' || destination == 'Y' || destination == "Width" || destination == "Height" || destination == 'Data') {
			reDrawPreviewWidget(widgetId, true);
		}

	});

	// Select widget to edit.
	screensWidgetsElement.on('dblclick', 'li', function() {
		selectScreenWidget(this);
	});

	// Input entries click.
	$('#tabs').on('click', '.inputEntry', function() {

		var widgetId = getSelectedWidgetId();
		var p = $(this).data('plugin');
		var f = parseInt($(this).data('Function'));
		var s = parseInt($(this).data('subFunction'));
		$('#inputDialog').dialog('close');
		widgets[widgetId]['Plugin'] = p;
		widgets[widgetId]['Function'] = f;
		widgets[widgetId]['SubFunction'] = s;

		var w = $('.selected', screensWidgetsElement);
		w.removeClass('selected');
		selectScreenWidget(w);
	});

	$('#widgetEditor').on('change blur', '#soItemScrollspeed', function() {

		var val = parseInt($(this).val());
		var elem = $('#screenPreview div.selected div.previewTextWidget');
		if (val & elem.html().length > parseInt($('#widgetW').val()) * parseInt($('#widgetH').val()) && !elem.hasClass('marquue'))
			elem.addClass('marquee');
		else
			elem.removeClass('marquee');
		elem.css('animation-duration', ((100 - (val * 9 / 10)) / 20) + 's');
	});

	populateSelect($('#rotation'), rotations, DEFAULT_SCREEN_ROTATION);
	$('#rotation').change();

	/***********
	 * buttons *
	 ***********/

	// Remove screen from output.
	$('#screenEditor').on('click', '.remove', function() {
		var li = $(this).parent();
		var screenId = li.data('id');
		removeScreenFromOutput(getCurrentOutput(), screenId);
		if (li.hasClass('selected')) {
			populateScreenFields();
			toggleScreensEditor(false);
			populateWidgetFields();
			toggleWidgetsEditor(false);
			screensWidgetsElement.html("");
			$('#addWidget').prop('disabled', true);
		}
		li.remove();
		$('#screen' + screenId).removeClass('selected');
		updateCounters();
	});

	// Remove widget from screen.
	$('#widgetEditor').on('click', '.remove', function() {
		var li = $(this).parent();
		var widgetId = li.data('id');
		removeWidgetFromScreen(getSelectedScreenId(), widgetId);
		removePreviewWidget(widgetId);
		if (li.hasClass('selected')) {
			populateWidgetFields();
			toggleWidgetsEditor(false);
		}
		li.remove();
		$('#widget' + widgetId).removeClass('selected');
		updateCounters();
	});

	// Add widgets and screens into editor.
	$('#screens, #widgets').on('click', '.add', function() {
		var li = $(this).parent();
		var id = li.data('id');
		if (li.hasClass('selected'))
			return false;
		if (li.attr('id') == 'widget' + id)
			createWidgetElement(id);
		else
			createScreenElement(id);
		updateCounters();
	});

	// Widget cloning.
	widgetsElement.on('click', '.clone', function() {
		var newWidgetId = getNewId(widgets);
		var newWidget = clone(widgets[$(this).parent().data('id')]);
		widgets[newWidgetId] = newWidget;
		populateGenericLi(newWidgetId, newWidget.Name, widgetsElement, 'widget');
		$('#widget' + newWidgetId).removeClass('selected');
		updateCounters();
	});

	// Screen Cloning.
	screensElement.on('click', '.clone', function() {
		var newScreenId = getNewId(screens);
		var newScreen = clone(screens[$(this).parent().data('id')]);
		screens[newScreenId] = newScreen;
		populateGenericLi(newScreenId, newScreen.Name, screensElement, 'screen');
		$('#screen' + newScreenId).removeClass('selected');
		updateCounters();
	});

	// Delete screens.
	widgetsElement.on('click', '.delete', function() {
		var li = $(this).parent();
		for (var screenId in screens) {
			removeWidgetFromScreen(screenId, li.data('id'));
		}
		li.remove();
		selectScreen($('#outputScreens li.selected'), true);
		updateCounters();
	});

	// Delete screens.
	screensElement.on('click', '.delete', function() {
		var li = $(this).parent();
		for (var output in outputs) {
			removeScreenFromOutput(output, li.data('id'));
		}
		li.remove();
		$('#output').trigger('change');
		updateCounters();
	});
	
	resetApplication();

});

function selectScreen(element, force) {

	if (typeof force == 'undefined')
		force = false;

	// Avoid selected elements.
	if (!force && $(element).hasClass('selected')) {
		return true;
	}

	var screenId = $(element).data('id');
	$('#outputScreens li.selected').removeClass('selected');
	$(element).addClass('selected');
	screensWidgetsElement.html("");
	$('#widgets li.selected').removeClass('selected');
	$('#addWidget').prop('disabled', false);
	populateWidgetFields();
	populateScreenFields(screens[screenId]);
	createPreviewScreen();
	if (screens[screenId].Widgets.length) {
		toggleWidgetsEditor(true);
		for (var widgetPos in screens[screenId].Widgets) {
			var widgetId = screens[screenId].Widgets[widgetPos];
			populateLi(widgetId, widgets[widgetId].Name, screensWidgetsElement, 'widget');
			$('#widget' + widgetId).addClass('selected');
		}
		$('#screenWidgets li:first-child').dblclick();
	}
	else {
		toggleWidgetsEditor(false);
	}
	updateCounters();
}

/**
 * Activates a screen widget, populating fields and preview.
 *
 * @param element jQuery element to populate.
 * @returns {Boolean}
 */
function selectScreenWidget(element) {

	// Avoid selected elements.
	if ($(element).hasClass('selected')) {
		return true;
	}

	var widgetId = $(element).data('id');
	$('#screenPreview .selected').removeClass('selected');
	$('#screenWidgets li.selected').removeClass('selected');
	populateWidgetFields(widgets[widgetId]);
	$(element).addClass('selected');
	$('#inputPicker').prop('disabled', false);
	reDrawPreviewWidget(widgetId, true);
	updateCounters();
}

function loadData(xmlData) {

	var root = $(xmlData).find('LCDSpicer');

	if (root.legth == 0 || root.attr('Version') != FILE_VERSION) {
		messageAdd('Invalid file format', 'error');
		return false;
	}

	resetApplication();

	// Load Widgets.
	$(root).find('Widgets').find('Widget').each(function() {
		var widgetTmp			= clone(widgetObj);
		var widgetId			= parseInt(this.getAttribute('Id'));
		widgetTmp.Name			= this.getAttribute('Name');
//		widgetTmp.group			= this.getAttribute('group');
		widgetTmp.X				= parseInt(this.getAttribute('X'));
		widgetTmp.Y				= parseInt(this.getAttribute('Y'));
		widgetTmp.Width			= parseInt(this.getAttribute('Width'));
		widgetTmp.Height		= parseInt(this.getAttribute('Height'));
		widgetTmp.Type			= parseInt(this.getAttribute('Type'));
		widgetTmp.Plugin		= this.getAttribute('Plugin');
		widgetTmp.Function		= parseInt(this.getAttribute('Function'));
		widgetTmp.SubFunction	= parseInt(this.getAttribute('SubFunction'));
		widgetTmp.Data			= this.getAttribute('Data');
		widgetTmp.Symbol		= parseInt(this.getAttribute('Symbol'));
		widgetTmp.Refresh		= parseInt(this.getAttribute('Refresh'));
		sanitizeWidget(widgetTmp);
		widgets[widgetId] = widgetTmp;
		populateGenericLi(widgetId, widgetTmp.Name, widgetsElement, 'widget');
	});
	messageAdd(Object.keys(widgets).length + ' widgets loaded', 'normal');

	// Load Screens.
	$(root).find('Screens').find('Screen').each(function() {
		var screenTmp		= clone(screenObj);
		var screenId		= parseInt(this.getAttribute('Id'));
		screenTmp.Name		= this.getAttribute('Name');
		screenTmp.Duration	= parseInt(this.getAttribute('Duration'));
		var widgets = this.getAttribute('Widgets').split(',');
		for (var widgetId in widgets) {
			screenTmp.Widgets.push(parseInt(widgets[widgetId]));
		}
		sanitizeScreen(screenTmp);
		screens[screenId] = screenTmp;
		populateGenericLi(screenId, screenTmp.Name, screensElement, 'screen');
	});
	messageAdd(Object.keys(screens).length + ' screens loaded', 'normal');

	var firstOutput = '';
	// Load Outputs.
	$(root).find('Outputs').find('Output').each(function() {
		var outputTmp		= clone(outputObj);
		var name			= this.getAttribute('Plugin');
		outputTmp.Cycle		= parseInt(this.getAttribute('Cycle'));
		outputTmp.Direction	= parseInt(this.getAttribute('Direction'));
		var screens = this.getAttribute('Screens').split(',');
		for (var screenId in screens) {
			outputTmp.Screens.push(parseInt(screens[screenId]));
		}
		sanitizeOutput(outputTmp);
		outputs[name] = outputTmp;
		if (!firstOutput.length) {
			firstOutput = name;
		}
	});
	messageAdd(Object.keys(outputs).length + ' outputs loaded', 'normal');

	if (firstOutput.length) {
		if (getCurrentOutput() == firstOutput)
			$('#output').change();
		else
			$('#output').val(firstOutput);
	}
	refreshUnUsed();
}

function populateOutputFields(outputData) {
	var rotation = DEFAULT_SCREEN_ROTATION;
	var reverse = false;

	if (typeof outputData != 'undefined') {
		rotation = outputData.cycle;
		reverse = screenData.reverse;
	}

	$('#rotation').val(rotation);
	$('#rotationReverse').prop('checked', reverse);
}

function populateScreenFields(screenData) {

	var name = "";
	var duration = DEFAULT_SCREEN_DURATION;

	if (typeof screenData != 'undefined') {
		name = screenData.Name;
		duration = screenData.Duration;
	}

	$('#screenName').val(name);
	$('#screenDuration').val(duration);
	$('#screenDurationTime').text(secondsToElapsedTime(duration));
}

function populateWidgetFields(widgetData) {

	var select = $('#widgetElement');
	var acceptCustomValues = false;
	var currenOutput = getCurrentOutput();
	select.html("");
	select.prop('disabled', true);
	$('#widgetUnit').parent().addClass('hidden');
	$('#widgetData').parent().addClass('hidden');

	var name		= "";
	var type		= 0;
	var X			= 1;
	var Y			= 1;
	var width		= 1;
	var height		= 1;
	var refresh		= 0;
	var plugin		= "None";
	var dataSource	= "None";
	var element		= "";
	var data		= "";
	var unit		= -1;
	var selectedSubFunction;

	if (typeof widgetData != 'undefined') {

		// Populate existing widget with plugin
		if (widgetData.Plugin != "") {
			selectedSubFunction = availableInputs[widgetData.Plugin][widgetData.Function].subFunctions[widgetData.SubFunction];
			var count = 0;
			var swap = {};
			for (var key in selectedSubFunction["values"]) {
				swap[selectedSubFunction["values"][key]] = key;
				count++;
			}
			if (count) {
				select.prop('disabled', false);
				populateSelect(select, swap, widgetData.Data, selectedSubFunction.acceptCustomValues);
			}

			if (selectedSubFunction.symbolType != "") {
				$('#widgetUnit').parent().removeClass('hidden');
				populateSelect($('#widgetUnit'), selectedSubFunction.symbolType)
			}

			acceptCustomValues	= selectedSubFunction.acceptCustomValues;
			dataSource			= selectedSubFunction.name;
			plugin				= widgetData.Plugin;
		}
		// Populate existing widget without plugin
		else {
			acceptCustomValues = true;
			$('#widgetData').parent().removeClass('hidden');
		}
		name		= widgetData.Name;
		type		= widgetData.Type;
		X			= widgetData.X;
		Y			= widgetData.Y;
		width		= widgetData.Width;
		height		= widgetData.Height;
		refresh		= widgetData.Refresh;
		if (acceptCustomValues)
			data	= widgetData.Data;
		unit		= widgetData.Unit;
	}

	// output elements
	var parameters = {};
	if (typeof availableOutputs[currenOutput] == "object")
		parameters = availableOutputs[currenOutput]['widgets'][type]['parameters'];
	var outputOptions = $('#outputOptions');
	outputOptions.html('<legend>Special Options</legend>');
	if (Object.keys(parameters).length) {
		outputOptions.removeClass('hidden');
		for (var pname in parameters) {
			createParameterElement(pname, parameters[pname]);
		}
	}
	else {
		outputOptions.addClass('hidden');
	}

	populateSelect($('#widgetType'), getOutputWidgetTypes(currenOutput), type);

	// Check if the element can be moved on the X axis.
	if (checkOutputRules(currenOutput, type, 'movableX') == 1)
		$('#widgetX').prop('disabled', false);
	else
		$('#widgetX').prop('disabled', true);

	// Check if the element can be moved on the Y axis.
	if (checkOutputRules(currenOutput, type, 'movableY') == 1)
		$('#widgetY').prop('disabled', false);
	else
		$('#widgetY').prop('disabled', true);

	// Check if the element can be resized on the X axis.
	if (checkOutputRules(currenOutput, type, 'resisableX') == 1) {
		$('#widgetW').prop('disabled', false);
	}
	else {
		width = checkOutputRules(currenOutput, type, 'sizeW');
		$('#widgetW').prop('disabled', true);
	}

	// Check if the element can be resized on the Y axis.
	if (checkOutputRules(currenOutput, type, 'resisableY') == 1) {
		$('#widgetH').prop('disabled', false);
	}
	else {
		height = checkOutputRules(currenOutput, type, 'sizeH');
		$('#widgetH').prop('disabled', true);
	}

	$('#widgetName').val(name);
	$('#widgetType').val(type);
	$('#widgetX').val(X);
	$('#widgetY').val(Y);
	$('#widgetW').val(width);
	$('#widgetH').val(height);
	$('#widgetRefresh').val(refresh);

	if (refresh > 0)
		$('#widgetRefreshTime').text(ticksToElapsedTime(refresh));
	else
		$('#widgetRefreshTime').text('Disabled');

	$('#widgetPlugin').text(plugin);
	$('#widgetSourceLabel').text(dataSource);
	$('#widgetData').val(data);
	$('#widgetUnit').val(unit);

	switch (type) {
	case widgetTypes.indexOf('Text'):

	}
}

/**
 * Populates a widget or screen.
 *
 * @param id the elements id.
 * @param name the element's name.
 * @param destination the jQuery element to hold the new li.
 */
function populateLi(id, name, destination, label) {
	var newLi = $('<li/>');
	newLi.html('<span>' + name + '</span><img class="remove" title="Remove this ' + label + '" alt="[×]" src="Pictures/Icons/remove.svg" />');
	newLi.data('id', id);
	destination.append(newLi);
}

/**
 * Populates generic widget or screen.
 *
 * @param id
 * @param text
 * @param destination
 */
function populateGenericLi(id, text, destination, label) {
	var newLi = $('<li id="' + label + id + '" class="unUsed"/>');
	newLi.html('<span>' + text + '</span><img class="delete" title="Delete this ' + label + '" alt="[D]" src="Pictures/Icons/delete.svg" /><img class="clone" title="Clone this ' + label + '" alt="[C]" src="Pictures/Icons/clone.svg" /><img class="add" title="Add this ' + label + ' into the current editor" alt="[A]" src="Pictures/Icons/addTo.svg" />');
	newLi.addClass('selected');
	newLi.data('id', id);
	destination.append(newLi);
}

/**
 * Populates a select with elements from an object.
 *
 * @param select the select jQuery element to populate.
 * @param elements the object/array with the elements.
 * @param selected if set will mark that element as selected.
 */
function populateSelect(select, elements, selected, addCustom) {
	select.html("");
	for (var prop in elements) {
		var newOpt = $('<option/>');
		newOpt.val(prop);
		newOpt.text(elements[prop]);
		select.append(newOpt);
	}
	if (typeof addCustom != "undefined" && addCustom) {
		select.append($('<option value="custom-value">Custom</option>'));
		if (typeof elements[selected] == "undefined")
			select.val('custom-value').change();
	}
	else if (typeof selected != "undefined")
		select.val(selected);
}

/**
 * Toggle On or Off the output editor area
 * 
 * @param status true to enable, false to disable.
 */
function toggleOutputsEditor(status) {
	$('#outputEditor select, #outputEditor input, #addScreen').prop('disabled', !status);
}

/**
 * Toggle ON or OFF the screen editor, only leave the screen add button untouched.
 *
 * @param status true to enable, false to disable.
 */
function toggleScreensEditor(status) {
	$('#screenName, #screenDuration, #addWidget').prop('disabled', !status);
}

/**
 * Toggle on or off the widget editor, only leave the widget add button untouched.
 *
 * @param status true to enable, false to disable.
 */
function toggleWidgetsEditor(status) {
	$('#widgetEditor input, #widgetEditor select, #generateWidgetName, #inputPicker').prop('disabled', !status);
}

function sanitizeOutput(outputData) {
	for (var screenPos in outputData.Screens) {
		if (typeof screens[outputData.Screens[screenPos]] == "undefined") {
			console.error('invalid screen ' + outputData.Screens[screenPos] + ' removed');
			var index = outputData.Screens.indexOf(screenPos);
			outputData.Screens.splice(index, 1);
		}
	}
}

/**
 * Sanitizes the screen information.
 *
 * @param screenData
 */
function sanitizeScreen(screenData) {

	// Validate duration in seconds.
	if (screenData.Duration < 0) {
		messageAdd('Invalid screen duration for screen ' + screenData.Name + ' changed to ' + DEFAULT_SCREEN_DURATION, 'error');
		screenData.Duration = DEFAULT_SCREEN_DURATION;
	}

	// Validate widgets.
	for (var widgetPos in screenData.Widgets) {
		if (typeof widgets[screenData.Widgets[widgetPos]] == "undefined") {
			console.error('Invalid widget ' + screenData.Widgets[widgetPos] + ' removed');
			var index = screenData.Widgets.indexOf(widgetPos);
			screenData.Widgets.splice(index, 1);
		}
	}
}

function sanitizeWidget(widgetData) {
	// Check if the element can be moved on the X axis.
	if (checkOutputRules(getCurrentOutput(), widgetData.Type, 'movableX') == 0)
		widgetData.X = 1;

	// Check if the element can be moved on the Y axis.
	if (checkOutputRules(getCurrentOutput(), widgetData.Type, 'movableY') == 0)
		widgetData.Y = 1;

	// Check if the element can be resized on the X axis.
	if (checkOutputRules(getCurrentOutput(), widgetData.Type, 'resisableX') == 0)
		widgetData.Width = 1;

	// Check if the element can be moved on the Y axis.
	if (checkOutputRules(getCurrentOutput(), widgetData.Type, 'resizableY') == 0)
		widgetData.Height = 1;
}

/**
 * Creates the input elements on the pick input dialog.
 */
function populateInputs() {

	if (typeof availableInputs == 'undefined' || typeof availableOutputs == 'undefined')
		return;

	for (var input in availableInputs) {
		for (var Function in availableInputs[input]) {
			var func = availableInputs[input][Function];
			var li = $('<li><a href="#Input' + input + Function + '">' + func.name + '</a></li>');
			$('#tabs > ul').append(li);
			var div = $('<div id="Input' + input + Function + '" />');
			$('#tabs').append(div);
			for (var subFunction in func.subFunctions) {
				var subFunc = func.subFunctions[subFunction];
				var dataType = subFunc.dataType & availableOutputs[getCurrentOutput()].widgets[$('#widgetType').val()].allowedDataTypes;
				var Class = dataTypes[subFunc.dataType] + ' ';
				if (!dataType)
					Class += dataTypes[dataType];
				else
					Class += 'inputEntry';
				var image;
				if (subFunc.image != "")
					image = subFunc.image;
				else
					image = 'sphere';
				var element = $('<div class="' + Class + '" title="' + subFunc.description + '"><img src="Pictures/Hardware/' + image + '_32.png" alt="X" />' + subFunc.name + '</div>');
				div.append(element);
				element.data('plugin', input);
				element.data('Function', Function);
				element.data('subFunction', subFunction);
			}
		}
	}
}

// TODO remove this and move the drawWidget inside the generator.
function createPreviewScreen() {

	var currentOutput = getCurrentOutput();
	if (currentOutput == "") {
		return;
	}
	// TODO move this
	var fontW = 8 * 2 + 1;
	var fontH = 8 * 2 + 1;
	for (var elem in randomizers) {
		window.clearInterval(randomizers[elem]);
	}
	randomizers = {};
	$('#widgetX').attr('max', availableOutputs[currentOutput].screenSizeX);
	$('#widgetY').attr('max', availableOutputs[currentOutput].screenSizeY);

	$('#screenPreview').html("");
	$('#screenPreview').css('background-size', fontW + 'px ' + fontH + 'px');
	$('#screenPreview').css('width', (fontW * availableOutputs[currentOutput].screenSizeX) + 'px');
	$('#screenPreview').css('height', (fontH * availableOutputs[currentOutput].screenSizeY) + 'px');

	var screenId = getSelectedScreenId();
	if (!screenId)
		return;
	for (var widgetPos in screens[screenId].Widgets) {
		drawPreviewWidget(screens[screenId].Widgets[widgetPos], false);
	}
}

function drawPreviewWidget(widgetId, selected) {

	var widget = widgets[widgetId];
	// TODO replace this with output values when ready.
	var fontW = 8 * 2 + 1;
	var fontH = 8 * 2 + 1;

	var screenLft = $('#screenPreview').position().left + 2;
	var screenTop = $('#screenPreview').position().top + 2;
	var newWidget = $('<div class="previewWidget widget' + widget.Type + '"></div>');

	var top = screenTop + ((widget.Y - 1) * fontH);
	var lft = screenLft + ((widget.X - 1) * fontW);

	newWidget.attr('id', 'previewWidget' + widgetId);
	newWidget.css('top', top + 'px');
	newWidget.css('left', lft + 'px');
	newWidget.css('width', (widget.Width * fontW) + 'px');
	newWidget.css('height', (widget.Height * fontH) + 'px');
	if (selected)
		newWidget.addClass('selected');

	switch (widget.Type) {
	case widgetTypes.indexOf('Text'):
		newWidget.append($('<div class="previewTextWidget"/>'));
		var inner = $('.previewTextWidget', newWidget);
		if (widget.Plugin.length) {
			if (widget.Refresh)
				randomizers[widgetId] = progressSimulation(widget.Type, inner, widget.Refresh);
			else
				inner.html("This is a Test");
		}
		else {
			inner.html(widget.Data);
		}

		var val = parseInt($('#soItemScrollspeed').val());
		if (inner.html().length > (widget.Width * widget.Height) && val > 0) {
			inner.addClass('marquee');
			inner.css('animation-duration', ((100 - (val * 90 / 100)) / 20) + 's');
		}
		break;

	case widgetTypes.indexOf('Bar'):
		newWidget.append($('<div class="progressBar"/>'));
		if (widget.Plugin.length) {
			if (widget.Refresh)
				randomizers[widgetId] = progressSimulation(widget.Type, newWidget, widget.Refresh);
			else
				$('.progressBar', newWidget).css('width', (widget.Width * fontW / 2) + 'px' );
		}
		else if (widget.Data)
			$('.progressBar', newWidget).css('width', (widget.Data * widget.Width  / 100 * fontW) + 'px' );
		break;

	default:
		newWidget = $('<div class="previewWidget widget' + widget.Type + '"></div>');
	}

	$('#screenPreview').append(newWidget);
}

function removePreviewWidget(widgetId) {
	if (typeof randomizers[widgetId] != 'undefined') {
		window.clearInterval(randomizers[widgetId]);
		delete randomizers[widgetId];
	}
	$('#previewWidget' + widgetId).remove();
}

function reDrawPreviewWidget(widgetId, selected) {
	removePreviewWidget(widgetId);
	drawPreviewWidget(widgetId, selected);
}