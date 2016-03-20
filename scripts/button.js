bp.button = (function () { 
	var DEFAULT_BUTTON_TEXT = "Run Bing Pong (35 searches)";
	
	var _previousText = DEFAULT_BUTTON_TEXT;
	var _buttonElement = document.getElementById('bpButton');
	
	var button = {};
	
	button.setText = function (newText) { 
		_previousText = _buttonElement.value;
		_buttonElement.value = newText;
	}
	
	button.setPreviousText = function () { 
		_buttonElement.value = _previousText;
	}
	
	button.markAsRunning = function () { 
		button.setText("Stop running Bing Pong");
		button.onClick = bp.button.stopRunning;
	}
	
	button.stopRunning = function () { 
		button.setPreviousText();
		stopRunningBingPong();
	}
	
	button.setPreviousText = function () { 
		_buttonElement.value = _previousText;
	}
	
	button.enable = function () { 
		_buttonElement.disabled = false;
	}
	
	button.disable = function () { 
		_buttonElement.disabled = true;
	}
	
	return button;
})();