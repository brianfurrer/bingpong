bp.status = (function () { 
	var DEFAULT_STATUS_TEXT = "Created by <a href=\"http://www.reddit.com/user/kiefferbp\" target=\"_blank\">/u/kiefferbp</a>. v0.21.1-28 (BETA)";
	
	var _statusTimer;
	
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
		var secondsLeft = timeInSeconds;
		var updateText;
		
		(updateText = function () { 
			var tempStatusText, tempRemainingText, tempExtraText;
		
			if (secondsLeft > 1) { // 2 or more seconds remain
				// so replace "%d second(s)" with "x seconds"
				tempStatusText = statusText.replace("(s)", "s").replace("%d", secondsLeft);
				tempRemainingText = remainingText.replace("(s)", "s").replace("%d", secondsLeft);
				tempExtraText = extraText.replace("(s)", "s").replace("%d", secondsLeft);
				status.change(tempStatusText, tempRemainingText, tempExtraText);
			} else if (secondsLeft === 1) { // 1 seconds remains
				// so replace "%d second(s)" with "1 second"
				tempStatusText = statusText.replace("(s)", "").replace("%d", secondsLeft);
				tempRemainingText = remainingText.replace("(s)", "").replace("%d", secondsLeft);
				tempExtraText = extraText.replace("(s)", "").replace("%d", secondsLeft);
				status.change(tempStatusText, tempRemainingText, tempExtraText);
			} else { // timer expired
				status.clearTimer();
				status.reset();
				callback();
			}
		})();
		
		_statusTimer = setInterval(function () { 
			secondsLeft--;
			updateText();
		}, 1000);
	}
	
	status.reset = function () { 
		bp.status.change(DEFAULT_STATUS_TEXT, "&nbsp;", "&nbsp;");
	}
	
	status.clearTimer = function () { 
		clearInterval(_statusTimer);
	}
	
	return status;
})();