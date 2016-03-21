bp.settings = (function () { 
	var RUN_ON_PAGE_LOAD_TIMEOUT = 1000;
	var SAVE_SETTINGS_TIMEOUT = 10;
	
	var settings = {};
	
	settings.init = function (callback) { 
		// delete the bad "auto" cookies
		if (bp.cookies.get("numberOfDesktopSearches")) {
			if (isNaN(bp.cookies.get("numberOfDesktopSearches"))) {
				bp.cookies.remove("numberOfDesktopSearches");
			} else {
				document.getElementById('numberOfDesktopSearches').value = bp.cookies.get("numberOfDesktopSearches");
				numberOfDesktopSearches = bp.cookies.get("numberOfDesktopSearches");
				bp.button.setText("Run Bing Pong (" + numberOfDesktopSearches + " searches)");
			}
		}

		if (bp.cookies.get("numberOfMobileSearches")) {
			// delete the bad "auto" cookies
			if (isNaN(bp.cookies.get("numberOfMobileSearches"))) {
				bp.cookies.remove("numberOfMobileSearches");
			} else { // good cookie
				document.getElementById('numberOfMobileSearches').value = bp.cookies.get("numberOfMobileSearches");
				numberOfMobileSearches = bp.cookies.get("numberOfMobileSearches");
			}
		}

		if (bp.helperTools.getHelperInstallationStatus()) {
			enterAutoInSearchBoxes();
			disableSearchOptions();
		} else {
			enableSearchOptions();
			disableMobileSearchOption();
		}

		if (bp.cookies.get("useSearchDelay") === "SEARCH_DELAY.ENABLED") {
			document.getElementById('useSearchDelayOption').checked = true;
			document.getElementById('minSearchDelayTime').disabled = false;
			document.getElementById('maxSearchDelayTime').disabled = false;
		}

		if (bp.cookies.get("minSearchDelayTime")) {
			minSearchDelayTime = bp.cookies.get("minSearchDelayTime");
			document.getElementById('minSearchDelayTime').value = minSearchDelayTime;
		}

		if (bp.cookies.get("maxSearchDelayTime")) {
			maxSearchDelayTime = bp.cookies.get("maxSearchDelayTime");
			document.getElementById('maxSearchDelayTime').value = maxSearchDelayTime;
		}

		if (bp.cookies.get("accountsPerIP") >= 0) {
			document.getElementById('accountsPerIP').selectedIndex = bp.cookies.get("accountsPerIP");
		}

		if (bp.helperTools.getHelperInstallationStatus()) {
			if (bp.cookies.get("useMultipleAccounts") === "MULTIPLE_ACCOUNTS.ENABLED") {
				document.getElementById('multipleAccountsOption').checked = true;
				document.getElementById('runInRandomOrderOption').disabled = false;
				document.getElementById('pauseOnCaptchaOption').disabled = false;
				document.getElementById('waitForIPChangeOption').disabled = false;
				
				bp.accountManager.updateDisplay();
			}

			if (bp.cookies.get("doDashboardTasks") === "DASHBOARD_TASKS.ENABLED") {
				document.getElementById('dashboardTasksOption').checked = true;
			}

			if (bp.cookies.get("pauseOnCaptcha") === "PAUSE_ON_CAPTCHA.ENABLED" && (bp.licensing.getLicenseStatus() || true)) {
				document.getElementById('pauseOnCaptchaOption').checked = true;
			}

			if (bp.cookies.get("waitForIPChange") === "WAIT_FOR_IP_CHANGE.ENABLED" && document.getElementById('multipleAccountsOption').checked && (bp.licensing.getLicenseStatus() || true)) {
				document.getElementById('waitForIPChangeOption').checked = true;
				document.getElementById('accountsPerIP').disabled = false;
			}

			if (bp.cookies.get("runInRandomOrder") === "RUN_IN_RANDOM_ORDER.ENABLED" && document.getElementById('multipleAccountsOption').checked) {
				document.getElementById('runInRandomOrderOption').checked = true;
			}

			if (bp.cookies.get("runOnPageLoad") === "RUN_ON_PAGE_LOAD.ENABLED") {
				document.getElementById('runOnPageLoadOption').checked = true;
			}

			if (bp.cookies.get("runOnPageLoad") === "RUN_ON_PAGE_LOAD.ENABLED" || location.href.indexOf("?runonpageload=1") != -1) {
				setTimeout(runBingPong, RUN_ON_PAGE_LOAD_TIMEOUT);
			}
		} else {
			if (bp.cookies.get("runOnPageLoad") === "RUN_ON_PAGE_LOAD.ENABLED") {
				document.getElementById('runOnPageLoadOption').checked = true;
				runBingPong();
			}
		}
		
		callback();
	}
	
	settings.save = function () { 
		bp.cookies.set("useMultipleAccounts", (document.getElementById('multipleAccountsOption').checked ? "MULTIPLE_ACCOUNTS.ENABLED" : "MULTIPLE_ACCOUNTS.DISABLED"));
		bp.cookies.set("doDashboardTasks", (document.getElementById('dashboardTasksOption').checked ? "DASHBOARD_TASKS.ENABLED" : "DASHBOARD_TASKS.DISABLED"));
		bp.cookies.set("pauseOnCaptcha", (document.getElementById('pauseOnCaptchaOption').checked ? "PAUSE_ON_CAPTCHA.ENABLED" : "PAUSE_ON_CAPTCHA.DISABLED"));
		bp.cookies.set("useSearchDelay", (document.getElementById('useSearchDelayOption').checked ? "SEARCH_DELAY.ENABLED" : "SEARCH_DELAY.DISABLED"));
		bp.cookies.set("runOnPageLoad", (document.getElementById('runOnPageLoadOption').checked ? "RUN_ON_PAGE_LOAD.ENABLED" : "RUN_ON_PAGE_LOAD.DISABLED"));
		bp.cookies.set("waitForIPChange", (document.getElementById('waitForIPChangeOption').checked ? "WAIT_FOR_IP_CHANGE.ENABLED" : "WAIT_FOR_IP_CHANGE.DISABLED"));
		bp.cookies.set("accountsPerIP", document.getElementById('accountsPerIP').selectedIndex);
		bp.cookies.set("runInRandomOrder", (document.getElementById('runInRandomOrderOption').checked ? "RUN_IN_RANDOM_ORDER.ENABLED" : "RUN_IN_RANDOM_ORDER.DISABLED"));

		// do not save invalid input
		if (parseFloat(document.getElementById('minSearchDelayTime').value) != NaN &&
			parseFloat(document.getElementById('maxSearchDelayTime').value) != NaN &&
			parseFloat(document.getElementById('minSearchDelayTime').value) < parseFloat(document.getElementById('maxSearchDelayTime').value)) {
			bp.cookies.set("minSearchDelayTime", document.getElementById('minSearchDelayTime').value);
			bp.cookies.set("maxSearchDelayTime", document.getElementById('maxSearchDelayTime').value);
		}

		if (!isNaN(document.getElementById('numberOfDesktopSearches').value)) {
			bp.cookies.set("numberOfDesktopSearches", document.getElementById('numberOfDesktopSearches').value);
		}

		if (!isNaN(document.getElementById('numberOfMobileSearches').value)) {
			bp.cookies.set("numberOfMobileSearches", document.getElementById('numberOfMobileSearches').value);
		}

		bp.status.changeWithTimeout("Settings have been saved.", "&nbsp;", "&nbsp;", 5, function () {});
	}
	
	settings.onChange = function () { 
		// check for invalid input in the min/max wait time and number of searches boxes, and disable the "Run Bing Pong" button if errors are found
		if (isNaN(parseFloat(document.getElementById('minSearchDelayTime').value)) ||
		isNaN(parseFloat(document.getElementById('maxSearchDelayTime').value)) ||
		(isNaN(parseFloat(document.getElementById('numberOfDesktopSearches').value)) && !bp.helperTools.getHelperInstallationStatus()) ||
		(parseFloat(document.getElementById('minSearchDelayTime').value) > parseFloat(document.getElementById('maxSearchDelayTime').value)) ||
		document.getElementById('minSearchDelayTime').value == "" ||
		document.getElementById('maxSearchDelayTime').value == "") {
			document.getElementById('runBingPongButton').disabled = true;
		} else {
			document.getElementById('runBingPongButton').disabled = false;
			minSearchDelayTime = document.getElementById('minSearchDelayTime').value;
			maxSearchDelayTime = document.getElementById('maxSearchDelayTime').value;
			numberOfDesktopSearches = document.getElementById('numberOfDesktopSearches').value;
			numberOfMobileSearches = document.getElementById('numberOfMobileSearches').value;
		}

		if (document.getElementById('useSearchDelayOption').checked) {
			document.getElementById('minSearchDelayTime').disabled = false;
			document.getElementById('maxSearchDelayTime').disabled = false;
		} else {
			document.getElementById('minSearchDelayTime').disabled = true;
			document.getElementById('maxSearchDelayTime').disabled = true;
		}

		if (document.getElementById('multipleAccountsOption').checked) {
			bp.accountManager.updateDisplay();

			document.getElementById('runInRandomOrderOption').disabled = false;
			document.getElementById('waitForIPChangeOption').disabled = false;
		} else {
			bp.accountManager.remove();
			document.getElementById('waitForIPChangeOption').disabled = true;
			document.getElementById('waitForIPChangeOption').checked = false;
			document.getElementById('accountsPerIP').disabled = true;
			document.getElementById('runInRandomOrderOption').disabled = true;
			document.getElementById('runInRandomOrderOption').checked = false;
			bp.button.setText("Run Bing Pong (" + numberOfDesktopSearches + " searches)");
		}

		if (document.getElementById('waitForIPChangeOption').checked) {
			document.getElementById('accountsPerIP').disabled = false;
		} else {
			document.getElementById('accountsPerIP').disabled = true;
		}

		// update the display with a timer to save settings
		bp.status.changeWithTimeout("Settings have been changed.", "Click <a href=\"javascript:void(0)\" onclick=\"bp.settings.save();\">HERE</a> to save them for future visits.", "This message will disappear in %d second(s)", SAVE_SETTINGS_TIMEOUT, function () {});
	}
	
	settings.enable = function () { 
		document.getElementById('runBingPongButton').disabled = false;
		document.getElementById('useSearchDelayOption').disabled = false;
		document.getElementById('runOnPageLoadOption').disabled = false;

		if (document.getElementById('useSearchDelayOption').checked) {
			document.getElementById('minSearchDelayTime').disabled = false;
			document.getElementById('minSearchDelayTime').disabled = false;
		}

		if (document.getElementById('multipleAccountsOption').checked) {
			document.getElementById('runInRandomOrderOption').disabled = false;
		}

		if (bp.helperTools.getHelperInstallationStatus()) {
			// enable dashboard tasks and multiple accounts, since they do not need a license
			document.getElementById('dashboardTasksOption').disabled = false;
			document.getElementById('multipleAccountsOption').disabled = false;
			document.getElementById('pauseOnCaptchaOption').disabled = false; // for now, captcha detection does not need a license

			if (document.getElementById('multipleAccountsOption').checked) {
				document.getElementById('waitForIPChangeOption').disabled = false;
			}

			if (document.getElementById('waitForIPChangeOption').checked) {
				document.getElementById('accountsPerIP').disabled = false;
			}
		}
	}
	
	settings.disable = function (alsoDisableRunButton) {
		if (alsoDisableRunButton) {
			document.getElementById('runBingPongButton').disabled = true;
		}

		document.getElementById('numberOfDesktopSearches').disabled = true;
		document.getElementById('numberOfMobileSearches').disabled = true;
		document.getElementById('useSearchDelayOption').disabled = true;
		document.getElementById('runOnPageLoadOption').disabled = true;
		document.getElementById('minSearchDelayTime').disabled = true;
		document.getElementById('maxSearchDelayTime').disabled = true;
		document.getElementById('multipleAccountsOption').disabled = true;
		document.getElementById('dashboardTasksOption').disabled = true;
		document.getElementById('pauseOnCaptchaOption').disabled = true;
		document.getElementById('waitForIPChangeOption').disabled = true;
		document.getElementById('accountsPerIP').disabled = true;
		document.getElementById('runInRandomOrderOption').disabled = true;
	}
	
	return settings;
})();