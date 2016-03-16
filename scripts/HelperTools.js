bp.helperTools = (function () {
	var _bphExtensionID = "cohnfldcnegepfhhfbcgecblgjdcmcka";

	ht.openDashboardForCaptcha = function (callback) {
		chrome.runtime.sendMessage(_bphExtensionID, {action: "openDashboardForCaptcha"}, function (response) {
			callback();
		});
	}

	ht.closeDashboardForCaptcha = function (callback) {
		chrome.runtime.sendMessage(_bphExtensionID, {action: "closeDashboardForCaptcha"}, function (response) {
			callback();
		});
	}

	ht.checkForSearchCaptcha = function (callback) {
		chrome.runtime.sendMessage(_bphExtensionID, {action: "checkForSearchCaptcha"}, function (response) {
			try {
				callback(response.tabIsDead, response.captchaDetected);
			} catch (e) {
				setTimeout(function () { checkForSearchCaptcha = function (callback); }, COMMUNICATION_FAILURE_DELAY);
			}
		});
	}

	ht.openSearchCaptcha = function (callback) {
		chrome.runtime.sendMessage(_bphExtensionID, {action: "bringSearchCaptchaIntoFocus"}, function (response) {
			callback();
		});
	}

	ht.closeSearchCaptcha = function (callback) {
		chrome.runtime.sendMessage(_bphExtensionID, {action: "moveSearchCaptchaBack"}, function (response) {
			callback();
		});
	}

	ht.enableMobileMode = function (callback) {
		chrome.runtime.sendMessage(_bphExtensionID, {action: "enableMobileMode"}, function (response) {
			callback();
		});
	}

	function disableMobileMode = function (callback) {
		chrome.runtime.sendMessage(_bphExtensionID, {action: "disableMobileMode"}, function (response) {
			callback();
		});
	}

	ht.deleteMicrosoftCookies = function (callback) {
		chrome.runtime.sendMessage(_bphExtensionID, {action: "deleteMicrosoftCookies"}, function (response) {
			callback();
		});
	}

	ht.openBPHOptions() {
		chrome.runtime.sendMessage(_bphExtensionID, {action: "openBPHOptions"}, function (response) {
			// do nothing
		});
	}

	ht.openSearchWindow = function (callback) {
		chrome.runtime.sendMessage(_bphExtensionID, {action: "openSearchWindow"}, function (response) {
			callback();
		});
	}

	ht.closeSearchWindow = function (callback) {
		chrome.runtime.sendMessage(_bphExtensionID, {action: "closeSearchWindow"}, function (response) {
			callback();
		});
	}

	ht.getWikiArticles = function (callback) {
		chrome.runtime.sendMessage(_bphExtensionID, {action: "getWikiArticles"}, function (response) {
			try {
				callback(response.queries);
			} catch (e) {
				getWikiArticles = function (callback);
			}
		});
	}

	ht.performGETRequest(ajaxURL, responseIsJSON, callback) {
		chrome.runtime.sendMessage(_bphExtensionID, {action: "performGETRequest", ajaxURL: ajaxURL, responseIsJSON: responseIsJSON}, function (response) {
			try {
				callback(response);
			} catch (e) {
				performGETRequest(ajaxURL, responseIsJSON, callback);
			}
		});
	}

	ht.getSearchWindowContents = function (callback) {
		chrome.runtime.sendMessage(_bphExtensionID, {action: "getSearchWindowContents"}, function (response) {
			try {
				callback(response.contents);
			} catch (e) {
				getSearchWindowContents = function (callback);
			}
		});
	}

	ht.logIntoAccount(username, password, callback) {
		chrome.runtime.sendMessage(_bphExtensionID, {action: "logIntoAccount", username: username, password: password}, function (response) {
			callback();
		});
	}

	ht.logoutOfAccount = function (callback) {
		chrome.runtime.sendMessage(_bphExtensionID, {action: "logoutOfAccount"}, function (response) {
			callback();
		});

	ht.openDashboardForVerifying = function (callback) {
		chrome.runtime.sendMessage(_bphExtensionID, {action: "openDashboardForVerifying"}, function (response) {
			callback();
		});
	}

	ht.openDashboard = function (callback) {
		chrome.runtime.sendMessage(_bphExtensionID, {action: "openDashboard"}, function (response) {
			callback();
		});
	}

	ht.openOutlook = function (callback) {
		chrome.runtime.sendMessage(_bphExtensionID, {action: "openOutlook"}, function (response) {
			callback();
		});
	}

	return ht;
})();
