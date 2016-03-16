bp.helperTools = (function () {
	var _bphExtensionID = "cohnfldcnegepfhhfbcgecblgjdcmcka";
	
	var helperTools = {};

	helperTools.openDashboardForCaptcha = function (callback) {
		chrome.runtime.sendMessage(_bphExtensionID, {action: "openDashboardForCaptcha"}, function (response) {
			callback();
		});
	}

	helperTools.closeDashboardForCaptcha = function (callback) {
		chrome.runtime.sendMessage(_bphExtensionID, {action: "closeDashboardForCaptcha"}, function (response) {
			callback();
		});
	}

	helperTools.checkForSearchCaptcha = function (callback) {
		chrome.runtime.sendMessage(_bphExtensionID, {action: "checkForSearchCaptcha"}, function (response) {
			try {
				callback(response.tabIsDead, response.captchaDetected);
			} catch (e) {
				helperTools.checkForSearchCaptcha(callback);
			}
		});
	}

	helperTools.openSearchCaptcha = function (callback) {
		chrome.runtime.sendMessage(_bphExtensionID, {action: "bringSearchCaptchaIntoFocus"}, function (response) {
			callback();
		});
	}

	helperTools.closeSearchCaptcha = function (callback) {
		chrome.runtime.sendMessage(_bphExtensionID, {action: "moveSearchCaptchaBack"}, function (response) {
			callback();
		});
	}

	helperTools.enableMobileMode = function (callback) {
		chrome.runtime.sendMessage(_bphExtensionID, {action: "enableMobileMode"}, function (response) {
			callback();
		});
	}

	function disableMobileMode = function (callback) {
		chrome.runtime.sendMessage(_bphExtensionID, {action: "disableMobileMode"}, function (response) {
			callback();
		});
	}

	helperTools.deleteMicrosoftCookies = function (callback) {
		chrome.runtime.sendMessage(_bphExtensionID, {action: "deleteMicrosoftCookies"}, function (response) {
			callback();
		});
	}

	helperTools.openBPHOptions() {
		chrome.runtime.sendMessage(_bphExtensionID, {action: "openBPHOptions"}, function (response) {
			// do nothing
		});
	}

	helperTools.openSearchWindow = function (callback) {
		chrome.runtime.sendMessage(_bphExtensionID, {action: "openSearchWindow"}, function (response) {
			callback();
		});
	}

	helperTools.closeSearchWindow = function (callback) {
		chrome.runtime.sendMessage(_bphExtensionID, {action: "closeSearchWindow"}, function (response) {
			callback();
		});
	}

	helperTools.getWikiArticles = function (callback) {
		chrome.runtime.sendMessage(_bphExtensionID, {action: "getWikiArticles"}, function (response) {
			try {
				callback(response.queries);
			} catch (e) {
				helperTools.getWikiArticles(callback);
			}
		});
	}

	helperTools.performGETRequest(ajaxURL, responseIsJSON, callback) {
		chrome.runtime.sendMessage(_bphExtensionID, {action: "performGETRequest", ajaxURL: ajaxURL, responseIsJSON: responseIsJSON}, function (response) {
			try {
				callback(response);
			} catch (e) {
				helperTools.performGETRequest(ajaxURL, responseIsJSON, callback);
			}
		});
	}

	helperTools.getSearchWindowContents = function (callback) {
		chrome.runtime.sendMessage(_bphExtensionID, {action: "getSearchWindowContents"}, function (response) {
			try {
				callback(response.contents);
			} catch (e) {
				helperTools.getSearchWindowContents(callback);
			}
		});
	}

	helperTools.logIntoAccount(username, password, callback) {
		chrome.runtime.sendMessage(_bphExtensionID, {action: "logIntoAccount", username: username, password: password}, function (response) {
			callback();
		});
	}

	helperTools.logoutOfAccount = function (callback) {
		chrome.runtime.sendMessage(_bphExtensionID, {action: "logoutOfAccount"}, function (response) {
			callback();
		});

	helperTools.openDashboardForVerifying = function (callback) {
		chrome.runtime.sendMessage(_bphExtensionID, {action: "openDashboardForVerifying"}, function (response) {
			callback();
		});
	}

	helperTools.openDashboard = function (callback) {
		chrome.runtime.sendMessage(_bphExtensionID, {action: "openDashboard"}, function (response) {
			callback();
		});
	}

	helperTools.openOutlook = function (callback) {
		chrome.runtime.sendMessage(_bphExtensionID, {action: "openOutlook"}, function (response) {
			callback();
		});
	}
	
	helperTools.checkForLicense = function (callback) { 
		try {
			chrome.runtime.sendMessage(_bphExtensionID, {action: "checkForLicense"}, function (response) {
				callback(response);
			});
		} catch (e) { 
			helperTools.checkForLicense(callback);
		}
	}
	
	return helperTools;
})();
