bp.status = (function () { 
	var DEFAULT_STATUS_TEXT = "Created by <a href=\"http://www.reddit.com/user/kiefferbp\" target=\"_blank\">/u/kiefferbp</a>. v0.21.1-22 (BETA)";
	
	var _statusTimeout;
	var _secondsLeft;
	
	var status = {};
	
	status.change = function (statusText, remainingText, extraText) {
		if (statusText !== "DO_NOT_CHANGE") {
			document.getElementById('status').innerHTML = statusText;
		}

		if (remainingText !== "DO_NOT_CHANGE") {
			document.getElementById('remaining').innerHTML = remainingText;
		}

		if (extraText !== "DO_NOT_CHANGE") {
			document.getElementById('extra').innerHTML = extraText;
		}
	}
	
	status.changeWithTimeout = function (statusText, remainingText, extraText, timeInSeconds, callback) {
		_secondsLeft = timeInSeconds;
		
		// replace any instance of "%d" with the number of seconds remaining
		status.change(statusText.replace("%d", _secondsLeft), remainingText.replace("%d", _secondsLeft), extraText.replace("%d", _secondsLeft));
	
		_statusTimeout = setInterval(function () { 
			var tempStatusText, tempRemainingText, tempExtraText;
			
			_secondsLeft--;
			
			if (_secondsLeft > 1) { // 2 or more seconds remain
				// so replace "%d second(s)" with "x seconds"
				tempStatusText = statusText.replace("(s)", "s").replace("%d", _secondsLeft);
				tempRemainingText = remainingText.replace("(s)", "s").replace("%d", _secondsLeft);
				tempExtraText = extraText.replace("(s)", "s").replace("%d", _secondsLeft);
				status.change(tempStatusText, tempRemainingText, tempExtraText);
			} else if (_secondsLeft === 1) { // 1 seconds remains
				// so replace "%d second(s)" with "1 second"
				tempStatusText = statusText.replace("(s)", "").replace("%d", _secondsLeft);
				tempRemainingText = remainingText.replace("(s)", "").replace("%d", _secondsLeft);
				tempExtraText = extraText.replace("(s)", "").replace("%d", _secondsLeft);
				status.change(tempStatusText, tempRemainingText, tempExtraText);
			} else { // timer expired
				status.clearTimer();
				status.reset();
				callback();
			}
		});
	}
	
	status.changeTextWithDefaultTimeout = function (statusText, remainingText, extraText, timeInSeconds) { 
		status.changeWithTimeout(statusText, remainingText, extraText, timeInSeconds, status.reset);
	}
	
	status.reset = function () { 
		bp.status.change(DEFAULT_STATUS_TEXT, "&nbsp;", "&nbsp;");
	}
	
	status.clearTimer = function () { 
		clearInterval(_statusTimeout);
	}
	
	return status;
})();