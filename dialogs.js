/**
 * Dialogs and general screen stuff.
 */

$(function() {

	/**
	 * Menu options.
	 */
	$('#mainMenu li').click(function() {

		if ($(this).hasClass('disabled'))
			return false;

		var action = $(this).attr('id');

		// Create new lcdspicer file.
		if (action == 'new') {
			if (isDirty == true) {
				callBackFunction = function() {
					resetApplication();
				}
				$('#unSaved').dialog('open');
			}
			else {
				resetApplication();
			}
			return;
		}

		// Open new file.
		if (action == 'open') {
			if (isDirty == true) {
				callBackFunction = function() {
					$('#fileLoader').click();
				}
				$('#unSaved').dialog('open');
			}
			else {
				$('#fileLoader').click();
			}
			return;
		}

		if (action == 'about') {
			$('#aboutDialog').dialog('open');
			return;
		}
	});

	/**
	 * Load file.
	 */
	$('#fileLoader').change(function() {
		var selectedFile = $(this)[0].files[0];
		var oldfileName = currentFileName;
		currentFileName = selectedFile.name;
		var reader = new FileReader();
		reader.onload = function() {
			if (this.error != null) {
				messageAdd('Unable to read the file ' + currentFileName + ' ' + this.error.name, 'error');
				currentFileName = oldfileName;
				return false;
			}
			messageAdd('File ' + currentFileName + ' loaded correctly');
			loadData(jQuery.parseXML(this.result));
		}
		reader.readAsText(selectedFile);
	});

	// Input picker dialog.
	$('#inputDialog').dialog({
		open: function(event,ui) {
			populateInputs();
			$("#tabs").tabs().addClass("ui-tabs-vertical ui-helper-clearfix");
			$("#tabs ul").removeClass("ui-corner-all").addClass("ui-corner-left");
			$("#tabs li").removeClass("ui-corner-top").addClass("ui-corner-left");
			$('#tabs .ui-tabs-panel').removeClass('ui-corner-bottom').addClass('ui-corner-right');

		},
		close: function(even, ui) {
			$("#tabs").tabs("destroy");
			$("#tabs").html('<ul/>');
		},
		autoOpen:	false,
		draggable:	false,
		resizable:	false,
		title:		"Select the input source",
		width:		$(window).width() * 0.8,
		height:		$(window).height() * 0.8,
		modal:		true,
		buttons: {
			'Cancel': function() {
				$(this).dialog('close');
			}
		}
	});

	// Avoid form submit.
	$('form').submit(function() {
		return false;
	});

	// Sortables
	$("#outputScreens").sortable({
		stop: function(event, ui) {
			outputs[getCurrentOutput()].Screens = [];
			$("#outputScreens li").each(function() {
				outputs[getCurrentOutput()].Screens.push($(this).data('id'));
			});
		}
	});
	$("#screenWidgets").sortable({
		stop: function(event, ui) {
			screens[getSelectedScreenId()].Widgets = [];
			$("#screenWidgets li").each(function() {
				screens[getSelectedScreenId()].Widgets.push($(this).data('id'));
			});
		}
	});

	// Main menu.
	$('#mainMenu').menu();

//	outputScreenElement.disableSelection();
//	screensWidgetsElement.disableSelection();

	// Tooltips @ doc level.
	$(document).tooltip();

	// About.
	$('#aboutDialog').dialog({
		autoOpen:	false,
		modal:		true,
		width:		$(window).width() * 0.6,
		height:		$(window).height() * 0.6,
		title:		"About LCDSpicer 2",
		buttons: {
			Ok: function() {
				$(this).dialog("close");
			}
		}
	});

	// UnSaved.
	$('#detectMissingDialog').dialog({
		autoOpen:	false,
		closeOnEscape: false,
		modal:		true,
		width:		$(window).width() * 0.6,
		height:		$(window).height() * 0.6,
		title:		"Missing detection file"
	});

	// UnSaved.
	$('#unSaved').dialog({
		autoOpen:	false,
		modal:		true,
		width:		$(window).width() * 0.6,
		height:		$(window).height() * 0.6,
		title:		"Unsaved changes",
		buttons: {
			Cancel: function() {
				$(this).dialog("close");
				callBackFunction = null;
			},
			Ok: function() {
				if (typeof callBackFunction !== 'function') {
					console.error('No defined callback function');
					messageAdd('Failed to complete.', 'error');
					$(this).dialog("close");
				}
				$(this).dialog("close");
				callBackFunction();
			}
		}
	});
});