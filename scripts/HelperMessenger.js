bp.HelperTools = (function () { 
	var _bphExtensionID = "cohnfldcnegepfhhfbcgecblgjdcmcka";

	function openDashboardForCaptcha(callback) { 
		chrome.runtime.sendMessage(_bphExtensionID, {action: "openDashboardForCaptcha"}, function (response) {
			callback();
		});
	}

	function closeDashboardForCaptcha(callback) { 
		chrome.runtime.sendMessage(_bphExtensionID, {action: "closeDashboardForCaptcha"}, function (response) {
			callback();
		});
	}

	function checkForSearchCaptcha(callback) {
		chrome.runtime.sendMessage(_bphExtensionID, {action: "checkForSearchCaptcha"}, function (response) {
			try {
				callback(response.tabIsDead, response.captchaDetected);
			} catch (e) {
				setTimeout(function () { checkForSearchCaptcha(callback); }, COMMUNICATION_FAILURE_DELAY);
			}
		});
	}
	
	function openSearchCaptcha(callback) {
		chrome.runtime.sendMessage(_bphExtensionID, {action: "bringSearchCaptchaIntoFocus"}, function (response) {
			callback();
		});
	}

	function closeSearchCaptcha(callback) { 
		chrome.runtime.sendMessage(_bphExtensionID, {action: "moveSearchCaptchaBack"}, function (response) {
			callback();
		});
	}

	function enableMobileMode(callback) { 
		chrome.runtime.sendMessage(_bphExtensionID, {action: "enableMobileMode"}, function (response) { 
			callback();
		});
	}

	function disableMobileMode(callback) { 
		chrome.runtime.sendMessage(_bphExtensionID, {action: "disableMobileMode"}, function (response) { 
			callback();
		});
	}	 

	function deleteMicrosoftCookies(callback) { 
		chrome.runtime.sendMessage(_bphExtensionID, {action: "deleteMicrosoftCookies"}, function (response) { 
			callback();
		});
	}

	function openBPHOptions() { 
		chrome.runtime.sendMessage(_bphExtensionID, {action: "openBPHOptions"}, function (response) { 
			// do nothing
		});
	}

	function openSearchWindow(callback) { 
		chrome.runtime.sendMessage(_bphExtensionID, {action: "openSearchWindow"}, function (response) {
			callback();
		});
	}

	function closeSearchWindow(callback) { 
		chrome.runtime.sendMessage(_bphExtensionID, {action: "closeSearchWindow"}, function (response) {
			callback();
		});
	}

	function getWikiArticles(callback) { 
		chrome.runtime.sendMessage(_bphExtensionID, {action: "getWikiArticles"}, function (response) { 
			try { 
				callback(response.queries);
			} catch (e) { 
				getWikiArticles(callback);
			}
		});
	}

	function performGETRequest(ajaxURL, responseIsJSON, callback) { 
		chrome.runtime.sendMessage(_bphExtensionID, {action: "performGETRequest", ajaxURL: ajaxURL, responseIsJSON: responseIsJSON}, function (response) { 
			try {
				callback(response);
			} catch (e) { 
				performGETRequest(ajaxURL, responseIsJSON, callback);
			}
		});
	}

	function getSearchWindowContents(callback) { 
		chrome.runtime.sendMessage(_bphExtensionID, {action: "getSearchWindowContents"}, function (response) { 
			try {
				callback(response.contents);
			} catch (e) { 
				getSearchWindowContents(callback);
			}
		});
	}
	
	function logIntoAccount(username, password) { 
		chrome.runtime.sendMessage(_bphExtensionID, {action: "logIntoAccount", username: username, password: password}, function (response) {
			callback();
		});
	}
	
	function logoutOfAccount() { 
		chrome.runtime.sendMessage(_bphExtensionID, {action: "logoutOfAccount"}, function (response) {
			callback();
		});
	
	function openDashboardForVerifying() { 
		chrome.runtime.sendMessage(_bphExtensionID, {action: "openDashboardForVerifying"}, function (response) {
			callback();
		});
	}
	
	return {
		openDashboardForCaptcha: openDashboardForCaptcha,
		closeDashboardForCaptcha: closeDashboardForCaptcha,
		checkForSearchCaptcha: checkForSearchCaptcha,
		openSearchCaptcha: openSearchCaptcha,
		closeSearchCaptcha: closeSearchCaptcha,
		enableMobileMode: enableMobileMode,
		disableMobileMode: disableMobileMode,
		deleteMicrosoftCookies: deleteMicrosoftCookies,
		openBPHOptions: openBPHOptions,
		openSearchWindow: openSearchWindow,
		closeSearchWindow: closeSearchWindow,
		getWikiArticles: getWikiArticles,
		performGETRequest: performGETRequest,
		getSearchWindowContents: getSearchWindowContents,
		logIntoAccount: logIntoAccount,
		logoutOfAccount: logoutOfAccount,
		openDashboardForVerifying: openDashboardForVerifying
	};
})();