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
		bp.button.setText("Stop running Bing Pong");
		_buttonElement.onclick = bp.button.stopRunning;
	}
	
	button.stopRunning = function () { 
		bp.button.setPreviousText();
		stopRunningBingPong(); // will be defined somewhere else --- this'll probably be in a different namespace than window
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