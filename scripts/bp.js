// Source Code for Bing Pong (www.bing-pong.com)
// Created By Brian Kieffer on 3/24/2013
// Current version: 0.21.1-0 (3/4/2016)

// constants
var MS_REQUIRED_TO_SHOW_DOWNLOAD_STATUS = 500;
var MAX_NUMBER_OF_LOGOUT_ATTEMPTS = 10;
var MAX_NUMBER_OF_LOGIN_ATTEMPTS = 3;
var MAX_NUMBER_OF_SEARCH_ATTEMPTS = 5;
var MAX_NUMBER_OF_TASK_ATTEMPTS = 5;
var SAVE_SETTINGS_TIMEOUT = 10;
var BAD_LOGIN_WARNING_TIMEOUT = 15;
var GOOD_LOGIN_MESSAGE_TIMEOUT = 4000;
var COMMUNICATION_FAILURE_DELAY = 500;
var CAPTCHA_MESSAGE_TIMEOUT = 1;
var REDIRECTION_SERVICE = "http://www.nullrefer.com/?";
var DEFAULT_STATUS_TEXT = "Created by <a href=\"http://www.reddit.com/user/kiefferbp\" target=\"_blank\">/u/kiefferbp</a>. v0.21.1-0";

// multiple account variables
var dashboardData;
var username;
var password;
var accountUsernames = new Array();
var accountPasswords = new Array();
var usernamesLeftToRun = new Array();
var passwordsLeftToRun = new Array();
var accountCredits = new Array();
var accountRedeemStatuses = new Array();
var accountCount = 0;
var accountsDone = 0;
var accountsToRun = 0;
var currentAccountIndex = 0;
var numberOfSearchesPerCredit = 2;
var creditsToGet;
var loginAttemptCount = 0;
var logoutAttemptCount = 0;
var dashboardTaskAttemptCount = 0;
var searchAttemptCount = 0;
var dashboardTaskURLs = new Array();
var newCredits = 0;
var initialIP = 0;
var sectionToDisplay = 1;

// ...?
var statusTimeout;
var dictionary = new Array();
var useThisDictionary;
var regularSearchesToPerform = 35;
var mobileSearchesToPerform = 20;
var redirectionServiceRequired = 1;
var previousButtonText;
var requestDownloadUpdates;
var minSearchDelayTime;
var maxSearchDelayTime;
var numberOfDesktopSearches = 35;
var numberOfMobileSearches = 20;
var stopRunningBingPongFlag = false; // for pausing/stopping

// bing pong helper variables
var bphExtensionID = "cohnfldcnegepfhhfbcgecblgjdcmcka";
var bphCanaryExtensionID = "omepikidpeoofklbmlidbbhojdhpggfj";
var bphInstallURL = "https://chrome.google.com/webstore/detail/" + bphExtensionID;
var bphCompatibleVersions = ["1.5.0.10", "1.5.0.11", "1.5.1.3", "1.6.0.1"];
var bphLatestVersion = "1.6.0.1";
var bphInstalled = false;

// license
var bp = {'isLicensed': false, 'licenseIsCached': false};

bp.checkForLicense = function (callback) {
	chrome.runtime.sendMessage(bphExtensionID, {action: "checkForLicense"}, function (response) {
		try {
			bp.isLicensed = response;
			bp.licenseIsCached = true
			Object.freeze(bp);

			// remove ads for licensed users
			setCookie("removeAd", bp.isLicensed);

			if (bp.isLicensed) {
				try {
					document.getElementById('ad').style.display = "none";
				} catch (e) {};
			}

			callback(response);
		} catch (e) {
			bp.checkForLicense(callback);
		}
	});
}

checkBrowserCompatibility(function () {
	// currently do nothing
});

function clearStatusTimeout() {
	clearTimeout(statusTimeout);
	clearInterval(statusTimeout);
}

function checkBrowserCompatibility(callback) {
	changeStatusText("<img src=\"loader.gif\" width=\"16\" height=\"16\"></img> Checking browser compatibility...", "DO_NOT_CHANGE", "DO_NOT_CHANGE");

	// it seems like Chrome is the only browser that can properly strip the referrer header with <meta name="referrer" content="never">
	// as a result, searches on any other browser will be sent through REDIRECT_SERVICE before they get sent to Bing
	if (window.chrome && chrome.runtime) {
		redirectionServiceRequired = 0;
		var bphInstalledVersion = "N/A";

		// enable the BPH options button
		// if BPH is not installed, this will be an install button
		document.getElementById('bphOptionsButton').disabled = false;

		// check for BPH (both stable and canary)
		chrome.runtime.sendMessage(bphExtensionID, {action: "testBPH"}, function (responseFromStable) {
			chrome.runtime.sendMessage(bphCanaryExtensionID, {action: "testBPH"}, function (responseFromCanary) {
				var bphInstalledVersion = "N/A";

				if (responseFromStable || responseFromCanary) { // BPH is installed
					bphInstalled = true;

					// check if the user is using the latest version of BPH (due to compatibility changes)
					if (responseFromStable && responseFromStable.bphVersion != "test") {
						bphInstalledVersion = responseFromStable.bphVersion;
					}

					// if canary is installed and it is compatible, use it instead of stable
					if (responseFromCanary && bphCompatibleVersions.indexOf(responseFromCanary.bphVersion) != -1) {
						bphExtensionID = bphCanaryExtensionID;
						bphInstalledVersion = responseFromCanary.bphVersion;
					}

					if (bphCompatibleVersions.indexOf(bphInstalledVersion) == -1) {
						changeStatusText("Please update Bing Pong Helper.", "Version installed: " + bphInstalledVersion, "Latest version: " + bphLatestVersion);
					}

					window.onunload = function () {
						disableMobileMode(function () {
							// do nothing else
						});
					};
				} else { // BPH is not installed, but Chrome is being used
					// change the BPH options button into an install button
					document.getElementById('bphOptionsButton').value = "Install Bing Pong Helper";
					document.getElementById('bphOptionsButton').onclick = function () {
						chrome.webstore.install(bphInstallURL, function () { // successful install
							// refresh the page
							setTimeout(function () {
								location.reload();
							}, 5000);
						}, function (details) { // install failed
							// do nothing at this time
						});
					};
				}

				if (!bphInstalled || bphCompatibleVersions.indexOf(bphInstalledVersion) != -1) {
					bp.checkForLicense(function (isLicensed) {
						parseCookieInfo(function () {
							if (!document.getElementById('runOnPageLoadOption').checked) {
								enableSettings();
								changeStatusText(DEFAULT_STATUS_TEXT, "DO_NOT_CHANGE", "DO_NOT_CHANGE");
							}

							callback();
						});
					});
				}
			});
		});
	} else {
		parseCookieInfo(function () {
			enableSettings();
			changeStatusText(DEFAULT_STATUS_TEXT, "DO_NOT_CHANGE", "DO_NOT_CHANGE");
			callback();
		});
	}
}

function parseCookieInfo(callback) {
	// delete the bad "auto" cookies
	if (getCookie("numberOfDesktopSearches")) {
		if (isNaN(getCookie("numberOfDesktopSearches"))) {
			deleteCookie("numberOfDesktopSearches");
		} else {
			document.getElementById('numberOfDesktopSearches').value = getCookie("numberOfDesktopSearches");
			numberOfDesktopSearches = getCookie("numberOfDesktopSearches");
			document.getElementById('runBingPongButton').value = "Run Bing Pong (" + numberOfDesktopSearches + " searches)";
		}
	}

	if (getCookie("numberOfMobileSearches")) {
		// delete the bad "auto" cookies
		if (isNaN(getCookie("numberOfMobileSearches"))) {
			deleteCookie("numberOfMobileSearches");
		} else { // good cookie
			document.getElementById('numberOfMobileSearches').value = getCookie("numberOfMobileSearches");
			numberOfMobileSearches = getCookie("numberOfMobileSearches");
		}
	}

	if (bphInstalled) {
		enterAutoInSearchBoxes();
		disableSearchOptions();
	} else {
		enableSearchOptions();
		disableMobileSearchOption();
	}

	if (getCookie("useSearchDelay") === "SEARCH_DELAY.ENABLED") {
		document.getElementById('useSearchDelayOption').checked = true;
		document.getElementById('minSearchDelayTime').disabled = false;
		document.getElementById('maxSearchDelayTime').disabled = false;
	}

	if (getCookie("minSearchDelayTime")) {
		minSearchDelayTime = getCookie("minSearchDelayTime");
		document.getElementById('minSearchDelayTime').value = minSearchDelayTime;
	}

	if (getCookie("maxSearchDelayTime")) {
		maxSearchDelayTime = getCookie("maxSearchDelayTime");
		document.getElementById('maxSearchDelayTime').value = maxSearchDelayTime;
	}

	if (getCookie("accountsPerIP") >= 0) {
		document.getElementById('accountsPerIP').selectedIndex = getCookie("accountsPerIP");
	}

	if (bphInstalled) {
		if (getCookie("useMultipleAccounts") === "MULTIPLE_ACCOUNTS.ENABLED") {
			document.getElementById('multipleAccountsOption').checked = true;
			document.getElementById('runInRandomOrderOption').disabled = false;
			document.getElementById('pauseOnCaptchaOption').disabled = false;

			if (bp.isLicensed || true) {
				document.getElementById('waitForIPChangeOption').disabled = false;
				// document.getElementById('pauseOnCaptchaOption').disabled = false;
			}

			updateAccountManagerDisplay();
		}

		if (getCookie("doDashboardTasks") === "DASHBOARD_TASKS.ENABLED") {
			document.getElementById('dashboardTasksOption').checked = true;
		}

		if (getCookie("pauseOnCaptcha") === "PAUSE_ON_CAPTCHA.ENABLED" && (bp.isLicensed || true)) {
			document.getElementById('pauseOnCaptchaOption').checked = true;
		}

		if (getCookie("waitForIPChange") === "WAIT_FOR_IP_CHANGE.ENABLED" && document.getElementById('multipleAccountsOption').checked && (bp.isLicensed || true)) {
			document.getElementById('waitForIPChangeOption').checked = true;
			document.getElementById('accountsPerIP').disabled = false;
		}

		if (getCookie("runInRandomOrder") === "RUN_IN_RANDOM_ORDER.ENABLED" && document.getElementById('multipleAccountsOption').checked) {
			document.getElementById('runInRandomOrderOption').checked = true;
		}

		if (getCookie("runOnPageLoad") === "RUN_ON_PAGE_LOAD.ENABLED") {
			document.getElementById('runOnPageLoadOption').checked = true;
		}

		if (getCookie("runOnPageLoad") === "RUN_ON_PAGE_LOAD.ENABLED" || location.href.indexOf("?runonpageload=1") != -1) {
			setTimeout(runBingPong, 1000);
		}

		callback();
	} else {
		if (getCookie("runOnPageLoad") === "RUN_ON_PAGE_LOAD.ENABLED") {
			document.getElementById('runOnPageLoadOption').checked = true;
			runBingPong();
		}

		callback();
	}
}

function changeStatusText(statusText, remainingText, extraText) {
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

function saveSettings() {
   	setCookie("useMultipleAccounts", (document.getElementById('multipleAccountsOption').checked ? "MULTIPLE_ACCOUNTS.ENABLED" : "MULTIPLE_ACCOUNTS.DISABLED"));
   	setCookie("doDashboardTasks", (document.getElementById('dashboardTasksOption').checked ? "DASHBOARD_TASKS.ENABLED" : "DASHBOARD_TASKS.DISABLED"));
   	setCookie("pauseOnCaptcha", (document.getElementById('pauseOnCaptchaOption').checked ? "PAUSE_ON_CAPTCHA.ENABLED" : "PAUSE_ON_CAPTCHA.DISABLED"));
   	setCookie("useSearchDelay", (document.getElementById('useSearchDelayOption').checked ? "SEARCH_DELAY.ENABLED" : "SEARCH_DELAY.DISABLED"));
   	setCookie("runOnPageLoad", (document.getElementById('runOnPageLoadOption').checked ? "RUN_ON_PAGE_LOAD.ENABLED" : "RUN_ON_PAGE_LOAD.DISABLED"));
   	setCookie("waitForIPChange", (document.getElementById('waitForIPChangeOption').checked ? "WAIT_FOR_IP_CHANGE.ENABLED" : "WAIT_FOR_IP_CHANGE.DISABLED"));
	setCookie("accountsPerIP", document.getElementById('accountsPerIP').selectedIndex);
	setCookie("runInRandomOrder", (document.getElementById('runInRandomOrderOption').checked ? "RUN_IN_RANDOM_ORDER.ENABLED" : "RUN_IN_RANDOM_ORDER.DISABLED"));

	// do not save invalid input
	if (parseFloat(document.getElementById('minSearchDelayTime').value) != NaN &&
		parseFloat(document.getElementById('maxSearchDelayTime').value) != NaN &&
		parseFloat(document.getElementById('minSearchDelayTime').value) < parseFloat(document.getElementById('maxSearchDelayTime').value)) {
		setCookie("minSearchDelayTime", document.getElementById('minSearchDelayTime').value);
		setCookie("maxSearchDelayTime", document.getElementById('maxSearchDelayTime').value);
   	}

   	if (!isNaN(document.getElementById('numberOfDesktopSearches').value)) {
		setCookie("numberOfDesktopSearches", document.getElementById('numberOfDesktopSearches').value);
   	}

	if (!isNaN(document.getElementById('numberOfMobileSearches').value)) {
		setCookie("numberOfMobileSearches", document.getElementById('numberOfMobileSearches').value);
   	}

	// clear the "settings have been changed..." timer
	clearStatusTimeout();

	changeStatusText("Settings have been saved.", "&nbsp;", "&nbsp;");
   	statusTimeout = setTimeout(function () {
   		changeStatusText(DEFAULT_STATUS_TEXT, "&nbsp;", "&nbsp;");
   		clearStatusTimeout();
   	}, 5000);
}

function onSettingsChange() {
	// clear any status timeout
	clearStatusTimeout();

	// check for invalid input in the min/max wait time and number of searches boxes, and disable the "Run Bing Pong" button if errors are found
	if (isNaN(parseFloat(document.getElementById('minSearchDelayTime').value)) ||
	isNaN(parseFloat(document.getElementById('maxSearchDelayTime').value)) ||
	(isNaN(parseFloat(document.getElementById('numberOfDesktopSearches').value)) && !bphInstalled) ||
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
  		updateAccountManagerDisplay();

  		document.getElementById('runInRandomOrderOption').disabled = false;

		if (bp.isLicensed || true) {
			document.getElementById('waitForIPChangeOption').disabled = false;
		}
  	} else {
  		hideAccountManagerDisplay();
		document.getElementById('waitForIPChangeOption').disabled = true;
		document.getElementById('waitForIPChangeOption').checked = false;
		document.getElementById('accountsPerIP').disabled = true;
		document.getElementById('runInRandomOrderOption').disabled = true;
		document.getElementById('runInRandomOrderOption').checked = false;
  		document.getElementById('runBingPongButton').value = "Run Bing Pong (" + numberOfDesktopSearches + " searches)";
  	}

  	if (document.getElementById('waitForIPChangeOption').checked) {
  		document.getElementById('accountsPerIP').disabled = false;
  	} else {
  		document.getElementById('accountsPerIP').disabled = true;
  	}

	// update the display with a timer to save settings
	var tempSeconds = SAVE_SETTINGS_TIMEOUT;
	changeStatusText("Settings have been changed.", "Click <a href=\"javascript:void(0)\" onclick=\"saveSettings();\">HERE</a> to save them for future visits.", "This message will disappear in " + tempSeconds + " seconds.");

	statusTimeout = setInterval(function () {
		tempSeconds--;
		if (tempSeconds > 1) {
			changeStatusText("DO_NOT_CHANGE", "DO_NOT_CHANGE", "This message will disappear in " + tempSeconds + " seconds.");
		} else if (tempSeconds == 1) {
			changeStatusText("DO_NOT_CHANGE", "DO_NOT_CHANGE", "This message will disappear in 1 second.");
		} else {
			changeStatusText(DEFAULT_STATUS_TEXT, "&nbsp;", "&nbsp;");
			clearStatusTimeout();
		}
	}, 1000);
}

function onGlobalCheckmarkChange() {
	setCookie("globalCheck", document.getElementById('globalCheckmark').checked);

	for (var i = 1; getCookie("check" + i); i++) {
		if (i > 5 && !bp.isLicensed) {
			break;
		}

		setCookie("check" + i, document.getElementById('globalCheckmark').checked);
	}

	updateAccountManagerDisplay();
}

function onAccountCheckmarksChange() {
	// delete the old checkmark cookies
	deleteCookie("globalCheck");

	for (var i = 1; getCookie("check" + i); i++) {
		deleteCookie("check" + i);
	}

	// set the checkmark cookies
	for (var i = 1; i <= accountCount; i++) {
		setCookie("check" + i, document.getElementById('check' + i).checked);
	}

	// set the global checkmark cookie
	var globalCheckmarkValue = true;

	for (var i = 1; getCookie("check" + i); i++) {
		// only consider the first five accounts when there is no license
		if (i > 5 && !bp.isLicensed) {
			break;
		}

		if (!getCookie("check" + i) || getCookie("check" + i) === "false") {
			globalCheckmarkValue = false;
			break;
		}
	}

	setCookie("globalCheck", globalCheckmarkValue);

	// update the account manager display
	updateAccountManagerDisplay();
}

function updateCreditCounter(data, useSearchWindowData) {
	if (useSearchWindowData) {
		if (data.indexOf("<meta name=\"mobileoptimized\"") == -1) { // PC search
			accountCredits[currentAccountIndex] = data.substring(data.indexOf("\"id_rc\"") + 8, data.indexOf("</span><span class=\"id_avatar sw_meIc\""));
		} else { // mobile search
			var temp = data.substring(data.indexOf("Transition.Event.refreshBalance(\'") + 33, data.length);
			accountCredits[currentAccountIndex] = temp.substring(0, temp.indexOf("\'"));
		}
	} else {
		tempIndex = data.indexOf("</div><div class=\"credits-label\">Available");
		accountCredits[currentAccountIndex] = data.substring(tempIndex - 4, tempIndex); // get 4 characters for the credit count (may contain ">")

		if (isNaN(accountCredits[currentAccountIndex])) { // 3 digit credit count
			accountCredits[currentAccountIndex] = data.substring(tempIndex - 3, tempIndex);
		}

		if (isNaN(accountCredits[currentAccountIndex])) { // 2 digit credit count
			accountCredits[currentAccountIndex] = data.substring(tempIndex - 2, tempIndex);
		}

		if (isNaN(accountCredits[currentAccountIndex])) { // 1 digit credit count
			accountCredits[currentAccountIndex] = data.substring(tempIndex - 1, tempIndex);
		}

		// check if the goal reward is redeemable
		isRedeemable = ((data.indexOf("<div class=\"progress-percentage\">100%") == -1) ? false : true);
		accountRedeemStatuses[currentAccountIndex] = isRedeemable;

		// store the redeemability status in a cookie
		setCookie("isRedeemable" + currentAccountIndex, isRedeemable);

		// update the credit counter display to reflect the redeemability status
		document.getElementById('credits' + currentAccountIndex).style.color = (isRedeemable ? "#00FF00" : "#FAFAFA");
		document.getElementById('accountName' + currentAccountIndex).style.color = (isRedeemable ? "#00FF00" : "#FAFAFA");
	}

   	// store the credit count in a cookie
   	setCookie("credits" + currentAccountIndex, accountCredits[currentAccountIndex]);

   	// update the credit counter display
   	document.getElementById('credits' + currentAccountIndex).innerHTML = (!isNaN(accountCredits[currentAccountIndex]) ? accountCredits[currentAccountIndex] : "<font color=\"red\">???</font>");
}

function stopRunningBingPong() {
	stopRunningBingPongFlag = true;
	document.getElementById('runBingPongButton').disabled = true;
	document.getElementById('runBingPongButton').value = "Stopping Bing Pong...";
	document.getElementById('runBingPongButton').onclick = runBingPong;
	changeStatusText("<img src=\"loader.gif\" width=\"16\" height=\"16\"></img> Waiting for the current operation to finish...", "&nbsp;", "&nbsp;");
}


function performThisStep(stepNumber) {
	if (stopRunningBingPongFlag) {
		finishRunningBingPong();
	} else {
		if (stepNumber == 0) { // log-out step
			loginAttemptAccount = 0;
			logoutAttemptAccount = 0;
			accountsDone++;

			// update the account manager display ONLY when initializing the first account
			if (document.getElementById('multipleAccountsOption').checked && accountsDone == 1) {
				updateAccountManagerDisplay();
			}

			if (document.getElementById('runInRandomOrderOption').checked) {
				// pick a random account from the list
				currentAccountIndex = Math.round(Math.random() * (usernamesLeftToRun.length - 1));

				// get the username and password corresponding to this index
				username = usernamesLeftToRun[currentAccountIndex];
				password = passwordsLeftToRun[currentAccountIndex];

				// remove the account from the accounts left to run
				usernamesLeftToRun.splice(currentAccountIndex, 1);
				passwordsLeftToRun.splice(currentAccountIndex, 1);

				// so that we can change the status of this account, set currentAccountIndex to be the index of the account in accountUsernames
				currentAccountIndex = accountUsernames.indexOf(username);
			} else { // otherwise, pick the first account and run it
				currentAccountIndex = 0;
				username = usernamesLeftToRun[currentAccountIndex];
				password = passwordsLeftToRun[currentAccountIndex];

				// remove the account from the accounts left to run
				usernamesLeftToRun.splice(currentAccountIndex, 1);
				passwordsLeftToRun.splice(currentAccountIndex, 1);

				// so that we can change the status of this account, set currentAccountIndex to be the index of the account in accountUsernames
				currentAccountIndex = accountUsernames.indexOf(username);
			}

			document.getElementById('status' + currentAccountIndex).innerHTML = "<img src=\"loader.gif\" width=\"10\" height=\"10\"></img>";
			changeStatusText("<img src=\"loader.gif\" width=\"16\" height=\"16\"></img> Signing in as " + username + "...", "&nbsp;", "&nbsp;");

			logoutOfAccount(function () {
				performThisStep(1);
			});
		} else if (stepNumber == 1) { // log-in step
			// changeStatusText("<img src=\"loader.gif\" width=\"16\" height=\"16\"></img> Signing in as " + username + "...", "&nbsp;", "&nbsp;");

			logIntoAccount(username, password, function () { // log-in successful
				performThisStep(2);
			}, function () { // maximum number of log-in attempts exceeded
				document.getElementById('status' + currentAccountIndex).innerHTML = "<i class=\"fa fa-exclamation-triangle\"></i>";
				document.getElementById('status_ms' + currentAccountIndex).innerHTML = "<i class=\"fa fa-exclamation-triangle\"></i>";
				// document.getElementById('status_tq' + currentAccountIndex).innerHTML = "<i class=\"fa fa-exclamation-triangle\"></i>";
				document.getElementById('status_dt' + currentAccountIndex).innerHTML = "<i class=\"fa fa-exclamation-triangle\"></i>";
				document.getElementById('credits' + currentAccountIndex).style.color = "#FF0000";
				document.getElementById('accountName' + currentAccountIndex).style.color = "#FF0000";
				document.getElementById('credits' + currentAccountIndex).style.color = "#FF0000";
				document.getElementById('credits' + currentAccountIndex).innerHTML = "BAD INFO?";

				performThisStep(9);
			}, function () { // account is blocked
				document.getElementById('status' + currentAccountIndex).innerHTML = "<i class=\"fa fa-exclamation-triangle\"></i>";
				document.getElementById('status_ms' + currentAccountIndex).innerHTML = "<i class=\"fa fa-exclamation-triangle\"></i>";
				// document.getElementById('status_tq' + currentAccountIndex).innerHTML = "<i class=\"fa fa-exclamation-triangle\"></i>";
				document.getElementById('status_dt' + currentAccountIndex).innerHTML = "<i class=\"fa fa-exclamation-triangle\"></i>";
				document.getElementById('credits' + currentAccountIndex).style.color = "#FFFF00";
				document.getElementById('accountName' + currentAccountIndex).style.color = "#FFFF00";
				document.getElementById('credits' + currentAccountIndex).style.color = "#FFFF00";
				document.getElementById('credits' + currentAccountIndex).innerHTML = "BLOCKED";

				performThisStep(9);
			}, function () { // account is banned
				document.getElementById('status' + currentAccountIndex).innerHTML = "<i class=\"fa fa-exclamation-triangle\"></i>";
				document.getElementById('status_ms' + currentAccountIndex).innerHTML = "<i class=\"fa fa-exclamation-triangle\"></i>";
				// document.getElementById('status_tq' + currentAccountIndex).innerHTML = "<i class=\"fa fa-exclamation-triangle\"></i>";
				document.getElementById('status_dt' + currentAccountIndex).innerHTML = "<i class=\"fa fa-exclamation-triangle\"></i>";
				document.getElementById('credits' + currentAccountIndex).style.color = "#FF0000";
				document.getElementById('accountName' + currentAccountIndex).style.color = "#FF0000";
				document.getElementById('credits' + currentAccountIndex).style.color = "#FF0000";
				document.getElementById('credits' + currentAccountIndex).innerHTML = "BANNED!!!";

				performThisStep(9);
			}, function () { // account needs a CAPTCHA to continue
				// GA tracking
				ga('send', 'event', 'Bing Pong', 'Statistics', 'Dashboard CAPTCHA');

				if (document.getElementById('pauseOnCaptchaOption').checked) {
					var tempSeconds = CAPTCHA_MESSAGE_TIMEOUT;
					changeStatusText("A CAPTCHA has been detected on the dashboard.", "To solve it, you will be taken there in " + tempSeconds + " seconds.", "&nbsp;");

					statusTimeout = setInterval(function () {
						tempSeconds--;
						if (tempSeconds > 1) {
							changeStatusText("A CAPTCHA has been detected on the dashboard.", "To solve it, you will be taken there in " + tempSeconds + " seconds.", "&nbsp;");
						} else if (tempSeconds == 1) {
							changeStatusText("A CAPTCHA has been detected on the dashboard.", "To solve it, you will be taken there in 1 second.", "&nbsp;");
						} else {
							changeStatusText("<img src=\"loader.gif\" width=\"16\" height=\"16\"></img> Opening the CAPTCHA...", "&nbsp;", "&nbsp;");
							clearStatusTimeout();
							openDashboardForCaptcha(function () {
								changeStatusText("<img src=\"loader.gif\" width=\"16\" height=\"16\"></img> Waiting for the CAPTCHA to be solved...", "Click <a href=\"#\" onclick=\"openDashboardForCaptcha(function(){console.log('');});return false;\">HERE</a> to manually open it again.", "This message will disappear once you have solved the CAPTCHA.");
								var captchaInterval = setInterval(function () {
									getDashboardContents(function () {
										if (dashboardData.indexOf("verify your account") == -1) {
											closeDashboardForCaptcha(function () {
												performThisStep(2);
												clearInterval(captchaInterval);
											});
										}
									});
								}, 3000);
							});
						}
					}, 1000);
				} else {
					document.getElementById('status' + currentAccountIndex).innerHTML = "<i class=\"fa fa-expeditedssl\"></i>";
					document.getElementById('status_ms' + currentAccountIndex).innerHTML = "<i class=\"fa fa-expeditedssl\"></i>";
					// document.getElementById('status_tq' + currentAccountIndex).innerHTML = "<i class=\"fa fa-expeditedssl\"></i>";
					document.getElementById('status_dt' + currentAccountIndex).innerHTML = "<i class=\"fa fa-expeditedssl\"></i>";
					document.getElementById('credits' + currentAccountIndex).style.color = "#FFFF00";
					document.getElementById('accountName' + currentAccountIndex).style.color = "#FFFF00";
					document.getElementById('credits' + currentAccountIndex).style.color = "#FFFF00";
					document.getElementById('credits' + currentAccountIndex).innerHTML = "CAPTCHA";

					performThisStep(9);
				}
			});
		} else if (stepNumber == 2) { // get the dashboard and parse it for credit count, number of searches to do, ...
			changeStatusText("<img src=\"loader.gif\" width=\"16\" height=\"16\"></img> Fetching the Bing Rewards dashboard...", "&nbsp;", "&nbsp;");

			parseDashboardContents(function () {
				// reset the dictionary
				dictionary = null;

				// check for missing searches or dashboard tasks and respond accordingly
				getSearchCreditCount(false, true, function (desktopSearchesAreComplete, numberOfDesktopCreditsObtained) {
					getSearchCreditCount(true, true, function (mobileSearchesAreComplete, numberOfMobileCreditsObtained) {
						getNumberOfMissingDashboardTasks(false, true, function (numberOfTasksIncomplete) {
							// update the account manager display if necessary
							if (document.getElementById('multipleAccountsOption').checked) {
								if (desktopSearchesAreComplete) {
									document.getElementById('status' + currentAccountIndex).innerHTML = "<i class=\"fa fa-check\"></i>";
								}

								if (mobileSearchesAreComplete) {
									document.getElementById('status_ms' + currentAccountIndex).innerHTML = "<i class=\"fa fa-check\"></i>";
								}

								if (!(numberOfTasksIncomplete > 0)) {
									document.getElementById('status_dt' + currentAccountIndex).innerHTML = "<i class=\"fa fa-check\"></i>";
								}
							}

							// proceed to the next incomplete item
							if (!desktopSearchesAreComplete) {
								performThisStep(4);
							} else if (!mobileSearchesAreComplete) {
								performThisStep(5);
							} else if (numberOfTasksIncomplete > 0 && document.getElementById('dashboardTasksOption').checked) {
								performThisStep(7);
							} else { // everything is done
								performThisStep(9);
							}
						});
					});
				});
			}, function () {
				performThisStep(9);
			});
		} else if (stepNumber == 3) { // download a word list to search with
			changeStatusText("<img src=\"loader.gif\" width=\"16\" height=\"16\"></img> Fetching the trending search terms...", "&nbsp;", "&nbsp;");

			parseTrendingSearchTerms(function () {
				performThisStep(4);
			});
		} else if (stepNumber == 4) { // perform PC searches
			changeStatusText("DO_NOT_CHANGE", "&nbsp;", "DO_NOT_CHANGE");

			if (bphInstalled) {
				// GA tracking
				ga('send', 'event', 'Bing Pong', 'Statistics', 'Searches done', regularSearchesToPerform);

				openSearchWindow(function () {
					// since BPH is installed, we can check for the number of search credits that are missing (and we can use cached dashboard data)
					getSearchCreditCount(false, true, function (desktopSearchesAreComplete, numberOfDesktopCreditsObtained) {
						performSearchesBPH(regularSearchesToPerform - numberOfDesktopCreditsObtained*numberOfSearchesPerCredit, false, function () {
							// again, we can use cached dashboard data. check for missing mobile search and dashboard task credits
							getSearchCreditCount(true, true, function (mobileSearchesAreComplete, numberOfMobileCreditsObtained) {
								getNumberOfMissingDashboardTasks(false, true, function (numberOfTasksIncomplete) {
									if (!mobileSearchesAreComplete) {
										performThisStep(5);
									} else if (numberOfTasksIncomplete > 0 && document.getElementById('dashboardTasksOption').checked) {
										performThisStep(7);
									} else { // everything is done
										performThisStep(9);
									}
								});
							});
						});
					});
				});
			} else {
				// GA tracking
				ga('send', 'event', 'Bing Pong', 'Statistics', 'Searches done', numberOfDesktopSearches);

				performSearchesLegacy(numberOfDesktopSearches, function () {
					finishRunningBingPong();
				});
			}
		} else if (stepNumber == 5) { // perform mobile searches
			changeStatusText("DO_NOT_CHANGE", "&nbsp;", "DO_NOT_CHANGE");

			// update the account status if needed (as mobile searches and multiple accounts will be separated later)
			if (document.getElementById('multipleAccountsOption').checked) {
				document.getElementById('status_ms' + currentAccountIndex).innerHTML = "<img src=\"loader.gif\" width=\"10\" height=\"10\"></img>";
			}

			// GA tracking
			ga('send', 'event', 'Bing Pong', 'Statistics', 'Searches done', mobileSearchesToPerform);

			openSearchWindow(function () {
				enableMobileMode(function () {
					getSearchCreditCount(true, true, function (mobileSearchesAreComplete, numberOfMobileCreditsObtained) {
						performSearchesBPH(mobileSearchesToPerform - 2*numberOfMobileCreditsObtained, true, function () {
							if (false) { // do trivia when done if the option is checked (placeholder code)
								performThisStep(6);
							} else if (document.getElementById('dashboardTasksOption').checked) { // if not, do the dashboard tasks if needed
								if (document.getElementById('multipleAccountsOption').checked) {
									// document.getElementById('status_tq' + currentAccountIndex).innerHTML = "<i class=\"fa fa-minus\"></i>";
								}

								getNumberOfMissingDashboardTasks(false, true, function (numberOfTasksIncomplete) {
									if (numberOfTasksIncomplete > 0 && document.getElementById('dashboardTasksOption').checked) {
										performThisStep(7);
									} else {
										performThisStep(9);
									}
								});
							} else { // otherwise, move to step 9
								if (document.getElementById('multipleAccountsOption').checked) {
									document.getElementById('status_dt' + currentAccountIndex).innerHTML = "<i class=\"fa fa-minus\"></i>";
									// document.getElementById('status_tq' + currentAccountIndex).innerHTML = "<i class=\"fa fa-minus\"></i>";
								}

								performThisStep(9);
							}
						});
					});
				});
			});
		} else if (stepNumber == 6) { // do the trivia
			// to-do

			if (document.getElementById('dashboardTasksOption').checked) { // do dashboard tasks when done if the option is checked
				performThisStep(7);
			} else { // otherwise, move to step 9
				if (document.getElementById('multipleAccountsOption').checked) {
					document.getElementById('status_dt' + currentAccountIndex).innerHTML = "<i class=\"fa fa-minus\"></i>";
				}

				performThisStep(9);
			}
		} else if (stepNumber == 7) { // get the list of dashboard tasks
			changeStatusText("<img src=\"loader.gif\" width=\"16\" height=\"16\"></img> Fetching the dashboard task list...", "&nbsp;", "&nbsp;");

			// update the account status if needed
			if (document.getElementById('multipleAccountsOption').checked) {
				document.getElementById('status_dt' + currentAccountIndex).innerHTML = "<img src=\"loader.gif\" width=\"10\" height=\"10\"></img>";
			}

			parseDashboardForTasks(function () {
				performThisStep(8);
			});
		} else if (stepNumber == 8) { // perform the dasboard tasks
			performDashboardTasks(function () {
				performThisStep(9);
			});
		} else if (stepNumber == 9) { // account/run finished
			if (accountsDone == accountsToRun || !document.getElementById('multipleAccountsOption').checked) { // finished
				finishRunningBingPong();
			} else { // accounts remain, so continue
				var proceed = function () {
					if (document.getElementById('waitForIPChangeOption').checked && accountsDone % (document.getElementById('accountsPerIP').selectedIndex + 1) == 0) { // wait for an IP change if needed
						changeStatusText("<img src=\"loader.gif\" width=\"16\" height=\"16\"></img> Waiting for an IP change...", "&nbsp;", "&nbsp;");
						waitForAnIPChange();
					} else { // move to the next account
						performThisStep(0);
					}
				};

				if (accountsDone >= 5) { // if 5 or more accounts have completed, check for a license before proceeding
					if (bp.isLicensed) { // is licensed, so proceed
						proceed();
					} else { // not licensed, so finish running Bing Pong
						finishRunningBingPong();
					}
				} else { // otherwise, just proceed
					proceed();
				}
			}
		} else {
			// more to come
		}
	}
}

function runBingPong() {
	clearStatusTimeout();
	disableSearchOptions();
	disableSettings(false);

	// change the "run Bing Pong" button into a stop buton
	document.getElementById('runBingPongButton').value = "Stop running Bing Pong";
	document.getElementById('runBingPongButton').onclick = stopRunningBingPong;

	if (document.getElementById('multipleAccountsOption').checked) {
		// prime the usernames/passwordsLeftToRun arrays
		usernamesLeftToRun = new Array();
		passwordsLeftToRun = new Array();

		for (var i = 1; i <= accountCount; i++) {
			// only add the account to the list if it is checked
			if (document.getElementById('check' + i).checked) {
				usernamesLeftToRun.push(accountUsernames[i]);
				passwordsLeftToRun.push(accountPasswords[i]);
			}
		}

		accountsToRun = usernamesLeftToRun.length;

		// GA tracking
		ga('send', 'event', 'Bing Pong', 'Statistics', 'Number of accounts', accountsToRun);

		// run the bot
		performThisStep(0);
	} else if (bphInstalled) { // bph is installed, but multiple accounts is not checked
		performThisStep(2);
	} else { // run in "legacy" mode
		performThisStep(3);
	}
}

function finishRunningBingPong() {
	accountsDone = 0;

	enableSettings();

	if (bphInstalled) {
		if (location.href.indexOf("?runonpageload=1") != -1) {
			// Bing Pong was told to run by Bing Pong Helper automatically, so close the window
			chrome.runtime.sendMessage(bphExtensionID, {action: "closeBPWindow"}, function (response) {});
		} else {
			enableSearchOptions();
		}
	}

	if (document.getElementById('multipleAccountsOption').checked) {
		document.getElementById('runBingPongButton').value = "Run Bing Pong (" + accountCount + " accounts configured)";
	} else {
		document.getElementById('runBingPongButton').value = "Run Bing Pong (" + numberOfDesktopSearches + " searches)";
	}

	// reset the run button onclick since it was changed to a stop button
	document.getElementById('runBingPongButton').onclick = runBingPong;

	if (stopRunningBingPongFlag) { // Bing Pong was stopped in the middle of a run
		changeStatusText(DEFAULT_STATUS_TEXT, "&nbsp;", "&nbsp;");

		statusTimeout = setTimeout(function() {
			changeStatusText(DEFAULT_STATUS_TEXT, "DO_NOT_CHANGE", "DO_NOT_CHANGE");
		}, 20000);

		// update the account manager display if possible
		if (document.getElementById('multipleAccountsOption').checked) {
			updateAccountManagerDisplay();
		}

		// reset the flag so that the next run will not be impeded
		stopRunningBingPongFlag = false;
	} else {
		changeStatusText("Done. <a href=\"http://www.bing.com/rewards/dashboard\" target=\"_blank\">Launch the Bing Rewards dashboard?</a>", "DO_NOT_CHANGE", "DO_NOT_CHANGE");

		statusTimeout = setTimeout(function() {
			changeStatusText(DEFAULT_STATUS_TEXT, "DO_NOT_CHANGE", "DO_NOT_CHANGE");
		}, 20000);
	}
}

function changeButtonText(newButtonText) {
	previousButtonText = document.getElementById('runBingPongButton').value;
	document.getElementById('runBingPongButton').value = newButtonText;
}

function revertButtonText() {
	document.getElementById('runBingPongButton').value = previousButtonText;
}

function getCookie(cookieName) {
	return window.localStorage.getItem(cookieName);
}

function setCookie(cookieName, cookieValue) {
	window.localStorage.setItem(cookieName, cookieValue);
}

function deleteCookie(cookieName) {
	window.localStorage.removeItem(cookieName);
}

function parseTrendingSearchTerms(callback) {
	$.ajax({
		type: 'GET',
		dataType: 'text',
		url: 'keywords.php',
		success: function (data) {
			// parse the page for the keywords
			var temp = data.split("document.getElementById(\"search\").focus();'>");
			dictionary = new Array();

			// add each of the keywords to the dictionary
			for (var i = 1; i < temp.length; i++) {
				dictionary.push(temp[i].substring(0, temp[i].indexOf("</span>")));
			}

			// return to caller
			callback();
		},
		error: function (data) {
			parseTrendingSearchTerms(callback);
		}
	});
}

function getDashboardContents(callback) {
	performGETRequest("https://www.bing.com/rewards/dashboard", false, function (contents) {
		// update the global dashboardData variable
		dashboardData = contents;

		// return to caller
		callback();
	});
}

function parseDashboardContents(callbackOnSuccess, callbackOnBadAccount) {
	getDashboardContents(function () {
		// ban checks
		if (dashboardData.indexOf("up to 2 credits a day") != -1 ||
		dashboardData.indexOf("For a limited time you're earning free credits.") != -1 ||
		dashboardData.indexOf("This isn't a Bing Rewards account.") != -1) {
			document.getElementById('status' + currentAccountIndex).innerHTML = "<i class=\"fa fa-exclamation-triangle\"></i>";
			document.getElementById('status_ms' + currentAccountIndex).innerHTML = "<i class=\"fa fa-exclamation-triangle\"></i>";
			document.getElementById('status_dt' + currentAccountIndex).innerHTML = "<i class=\"fa fa-exclamation-triangle\"></i>";
			document.getElementById('credits' + currentAccountIndex).style.color = "#FF0000";
			document.getElementById('accountName' + currentAccountIndex).style.color = "#FF0000";
			document.getElementById('credits' + currentAccountIndex).style.color = "#FF0000";
			document.getElementById('credits' + currentAccountIndex).innerHTML = "BANNED!!!";

			// continue with the next account
			callbackOnBadAccount();
			return;
		}

		// get the number of credits required to max out the PC search credits for the day
		if (dashboardData.indexOf("15 credits a day") != -1) {
			searchCountText = "15 credits a day";
			creditsToGet = 15;
		} else if (dashboardData.indexOf("15 credits per day") != -1) {
			searchCountText = "15 credits per day";
			creditsToGet = 15;
		} else if (dashboardData.indexOf("20 credits a day") != -1) {
			searchCountText = "20 credits a day";
			creditsToGet = 20;
		} else if (dashboardData.indexOf("30 credits a day") != -1) {
			searchCountText = "30 credits a day";
			creditsToGet = 30;
		} else if (dashboardData.indexOf("60 credits a day") != -1) {
			searchCountText = "60 credits a day";
			creditsToGet = 60;
		} else if (dashboardData.indexOf("Search with Bing on your PC and earn up to 5 times your daily credits") != -1 && data.responseText.indexOf("of 75 credits") != -1) {
			searchCountText = "Search with Bing on your PC and earn up to 5 times your daily credits";
			creditsToGet = 75;
		} else if (dashboardData.indexOf("Search with Bing on your PC and earn up to 5 times your daily credits") != -1 && data.responseText.indexOf("of 150 credits") != -1) {
			searchCountText = "Search with Bing on your PC and earn up to 5 times your daily credits";
			creditsToGet = 150;
		} else { // fail account
			document.getElementById('status' + currentAccountIndex).innerHTML = "<i class=\"fa fa-exclamation-triangle\"></i>";
			document.getElementById('status_ms' + currentAccountIndex).innerHTML = "<i class=\"fa fa-exclamation-triangle\"></i>";
			document.getElementById('status_dt' + currentAccountIndex).innerHTML = "<i class=\"fa fa-exclamation-triangle\"></i>";
			document.getElementById('credits' + currentAccountIndex).style.color = "#FFFF00";
			document.getElementById('accountName' + currentAccountIndex).style.color = "#FFFF00";
			document.getElementById('credits' + currentAccountIndex).style.color = "#FFFF00";
			document.getElementById('credits' + currentAccountIndex).innerHTML = "BLOCKED";

			// continue with the next account
			callbackOnBadAccount();
			return;
		}

		// append " Start with US news." to the searchCountText (v0.20.47)
		searchCountText += ". Start with US news.";

		// get the number of searches required to get one credit from PC searching
		numberOfSearchesPerCredit = ((dashboardData.indexOf("PC search</span><span class=\"desc\">Earn 1 credit per 2 Bing searches") != -1) ? 2 : 3);

		// set the number of searches Bing Pong needs to do
		regularSearchesToPerform = numberOfSearchesPerCredit*creditsToGet;

		// if applicable, fetch the number of credits the account has and update the display
		if (document.getElementById('multipleAccountsOption').checked) {
			updateCreditCounter(dashboardData, false);
		}

		// return to caller
		callbackOnSuccess();
	});
}

function generateSearchURL(doMobileSearches, callback) {
	var url = "";
	var searchExpression;

	// use a random wiki article if BPH is installed, and a trending search term otherwise
	if (bphInstalled) {
		if (dictionary && dictionary.length) { // if there are search terms remaining from the last time we got the wiki articles
			// just use one of those to make a search
			searchExpression = ((dictionary.pop()).split(" ")).join("+"); // replace spaces with pluses

			if (doMobileSearches) {
				// match the URL scheme used by Bing when searching from the front page
				url += "http://www.bing.com/search?q=" + searchExpression + "&qs=n&form=QBLH&pq=" + searchExpression + "&sc=12-" + searchExpression.length + "&sp=-1&sk=";
			} else {
				// match the URL scheme used by the Bing Rewards Chrome extension
				url += "https://www.bing.com/search?FORM=U312DF&PC=U312&q=" + searchExpression;
			}

			// return to caller
			callback(url);
		} else { // otherwise, get ten wiki articles and generate a URL with those
			getWikiArticles(function (queries) {
				dictionary = queries;
				generateSearchURL(doMobileSearches, callback);
			});
		}
	} else { // BPH is not installed --- note that this means that we do not need to check for the doMobileSearches flag
		searchExpression = ((dictionary[Math.floor(dictionary.length * Math.random())].toLowerCase()).split(" ")).join("+"); // replace spaces with pluses

		if (redirectionServiceRequired) {
			url += REDIRECTION_SERVICE;
		}

		// match the URL scheme used by the Bing Rewards Chrome extension
		url += "https://www.bing.com/search?FORM=U312DF&PC=U312&q=" + searchExpression;

		// return to caller
		callback(url);
	}
}

function getMinSearchDelayTime() {
	return 1000*(document.getElementById('useSearchDelayOption').checked ? minSearchDelayTime : 0);
}

function getMaxSearchDelayTime() {
	return 1000*(document.getElementById('useSearchDelayOption').checked ? maxSearchDelayTime : 0);
}

function handleSearchCaptcha(numberOfSearches, doMobileSearches, callback) {
	// GA tracking
	ga('send', 'event', 'Bing Pong', 'Statistics', 'Search CAPTCHA');

	var tempSeconds = CAPTCHA_MESSAGE_TIMEOUT;
	statusTimeout = setInterval(function () {
		tempSeconds--;
		if (tempSeconds > 1) {
			changeStatusText("A CAPTCHA has been detected during searching.", "To solve it, you will be taken there in " + tempSeconds + " seconds.", "&nbsp;");
		} else if (tempSeconds == 1) {
			changeStatusText("A CAPTCHA has been detected during searching.", "To solve it, you will be taken there in 1 second.", "&nbsp;");
		} else {
			changeStatusText("<img src=\"loader.gif\" width=\"16\" height=\"16\"></img> Opening the CAPTCHA...", "&nbsp;", "&nbsp;");
			clearStatusTimeout();
			bringSearchCaptchaIntoFocus(function () {
				changeStatusText("<img src=\"loader.gif\" width=\"16\" height=\"16\"></img> Waiting for the CAPTCHA to be solved...", "This message will disappear once you have solved the CAPTCHA.", "&nbsp;");
				var captchaInterval = setInterval(function () {
					checkForSearchCaptcha(function (tabIsDead, captchaDetected) {
						if (!captchaDetected) {
							clearInterval(captchaInterval);

							moveSearchCaptchaBack(function () {
								if (stopRunningBingPongFlag) {
									// we need to call performThisStep() again to get Bing Pong to stop
									disableMobileMode(function () {
										closeSearchWindow(function () {
											performThisStep(0);
										});
									});
								} else {
									changeStatusText("DO_NOT_CHANGE", "&nbsp;", "&nbsp;");
									performSearchesBPH(numberOfSearches, doMobileSearches, callback);
								}
							});
						}
					});
				}, 3000);
			});
		}
	}, 1000);
}

function performSearchesBPH(numberOfSearches, doMobileSearches, callback) {
	if (searchAttemptCount <= MAX_NUMBER_OF_SEARCH_ATTEMPTS) { // search attempts remaining
		// update the display
		if (doMobileSearches) {
 			changeStatusText("<img src=\"loader.gif\" width=\"16\" height=\"16\"></img> Performing mobile searches...", "DO_NOT_CHANGE", "DO_NOT_CHANGE");
 		} else {
 			changeStatusText("<img src=\"loader.gif\" width=\"16\" height=\"16\"></img> Performing searches...", "DO_NOT_CHANGE", "DO_NOT_CHANGE");
 		}

 		// request Bing Pong Helper to do a search
 		generateSearchURL(doMobileSearches, function (url) {
			chrome.runtime.sendMessage(bphExtensionID, {action: "performSearch", searchURL: url, minDelay: getMinSearchDelayTime(), maxDelay: getMaxSearchDelayTime()}, function (response) {
				var continueSearching;

				var checkForCaptcha = function () {
					checkForSearchCaptcha(function (tabIsDead, captchaDetected) {
						if (stopRunningBingPongFlag) {
							// we need to call performThisStep() again to get Bing Pong to stop
							disableMobileMode(function () {
								closeSearchWindow(function () {
									performThisStep(0);
								});
							});
						} else if (tabIsDead) {
							continueSearching();
						} else if (captchaDetected) { // search captcha detected
							handleSearchCaptcha(numberOfSearches, doMobileSearches, callback);
						} else { // no captcha
							// update the credit counter with fresh data from the search window
							getSearchWindowContents(function (contents) {
								if (document.getElementById('multipleAccountsOption').checked) {
									updateCreditCounter(contents, true);
								}
							});

							continueSearching();
						}
					});
				};

				checkForCaptcha();

				continueSearching = function () {
					numberOfSearches--;

					if (doMobileSearches) {
						if (numberOfSearches == 1) {
							changeStatusText("DO_NOT_CHANGE", "1 mobile search remaining", "DO_NOT_CHANGE");
						} else {
							changeStatusText("DO_NOT_CHANGE", numberOfSearches + " mobile searches remaining", "DO_NOT_CHANGE");
						}
					} else {
						if (numberOfSearches == 1) {
							changeStatusText("DO_NOT_CHANGE", "1 search remaining", "DO_NOT_CHANGE");
						} else {
							changeStatusText("DO_NOT_CHANGE", numberOfSearches + " searches remaining", "DO_NOT_CHANGE");
						}
					}

					// recursively call this function until all searches are completed
					if (numberOfSearches > 0) {
						performSearchesBPH(numberOfSearches, doMobileSearches, callback);
					} else {
						// verify searches and return to caller
						if (doMobileSearches) {
							disableMobileMode(function () {
								verifySearches(doMobileSearches, callback);
							});
						} else {
							verifySearches(doMobileSearches, callback);
						}
					}
				};
			});
		});
	} else { // searches failed
		// reset the search attempt counter
		searchAttemptCount = 0;

		// update the account status
		if (doMobileSearches) {
			document.getElementById('status_ms' + currentAccountIndex).innerHTML = "<i class=\"fa fa-times\"></i>";

			// disable mobile mode and return to caller
			disableMobileMode(function () {
				callback();
			});
		} else {
			document.getElementById('status' + currentAccountIndex).innerHTML = "<i class=\"fa fa-times\"></i>";

			// return to caller
			callback();
		}
	}
}

function performSearchesLegacy(numberOfSearches, callback) {
	searchAttemptCount++;

	// update the display
	changeStatusText("<img src=\"loader.gif\" width=\"16\" height=\"16\"></img> Performing searches...", numberOfSearches + " searches remaining", "DO_NOT_CHANGE");

 	if (redirectionServiceRequired) {
 		var searchOccurred = false;

 		// set up a search in the iframe
 		generateSearchURL(false, function (url) {
			document.getElementById('searchFrame').src = url;
		});

		// the redirection service causes the iframe to load twice per search, so we need to consider a search done only after the onload fires twice
		document.getElementById('searchFrame').onload = function () {
			setTimeout(function () {
				if (stopRunningBingPongFlag) {
					// we need to call performThisStep() again to get Bing Pong to stop
					performThisStep(0);
				} else if (searchOccurred) {
					numberOfSearches--;
					searchOccurred = false;

					if (numberOfSearches > 0) { // searches are incomplete
						generateSearchURL(false, function (url) {
							document.getElementById('searchFrame').src = url;
						});

						if (numberOfSearches == 1) {
							changeStatusText("DO_NOT_CHANGE", "1 search remaining", "DO_NOT_CHANGE");
						} else {
							changeStatusText("DO_NOT_CHANGE", numberOfSearches + " searches remaining", "DO_NOT_CHANGE");
						}
					} else { // searches are complete
						// remove onload handler from the iframe
						document.getElementById('searchFrame').onload = function () {};

						// clear the remaining indicator
						changeStatusText("DO_NOT_CHANGE", "&nbsp;", "DO_NOT_CHANGE");

						// return to caller
						callback();
					}
				} else {
					searchOccurred = true;
				}
			}, 10 + getMinSearchDelayTime() + (getMaxSearchDelayTime() - getMinSearchDelayTime() - 10)*Math.random());
		}
	} else {
		generateSearchURL(false, function (url) {
			document.getElementById('searchFrame').src = url;
		});

		document.getElementById('searchFrame').onload = function () {
			setTimeout(function () {
				numberOfSearches--;

				if (numberOfSearches > 0) { // searches are incomplete
					generateSearchURL(false, function (url) {
						document.getElementById('searchFrame').src = url;
					});

					if (numberOfSearches == 1) {
						changeStatusText("DO_NOT_CHANGE", "1 search remaining", "DO_NOT_CHANGE");
					} else {
						changeStatusText("DO_NOT_CHANGE", numberOfSearches + " searches remaining", "DO_NOT_CHANGE");
					}
				} else { // searches are complete
					// remove onload handler from the iframe
					document.getElementById('searchFrame').onload = function () {};

					// clear the remaining indicator
					changeStatusText("&nbsp;", "&nbsp;", "DO_NOT_CHANGE");

					// return to caller
					callback();
				}
			}, 10 + getMinSearchDelayTime() + (getMaxSearchDelayTime() - getMinSearchDelayTime() - 10)*Math.random());
		};
	}
}

function getSearchCreditCount(doMobileSearches, useCachedDashboardData, callback) {
	var proceed = function () {
		if (doMobileSearches) {
			if (dashboardData.indexOf("Earn 1 credit per 2 Bing searches up to 10 credits a day.</span></span><div class=\"check-wrapper tile-height\"><div class=\"check close-check dashboard-sprite\"></div></div><div class=\"progress\">10 credits") == -1) { // mobile searches are incomplete
				var tempString = "Earn 1 credit per 2 Bing searches up to 10 credits a day.</span></span><div class=\"check-wrapper tile-height\"><div class=\"check open-check dashboard-sprite\"></div></div><div class=\"progress\">";
				callback(false, dashboardData.substring(dashboardData.indexOf(tempString) + 191, dashboardData.indexOf(tempString) + 192));
			} else { // mobile searches are complete
				callback(true, 10);
			}
		} else {
			if (dashboardData.indexOf("<div class=\"progress\">" + creditsToGet + " credits") == -1) { // PC searches are incomplete
				callback(false, dashboardData.substring(dashboardData.indexOf(searchCountText) + 134 + searchCountText.length, dashboardData.indexOf(searchCountText) + 136 + searchCountText.length));
			} else { // PC searches are complete
				callback(true, creditsToGet);
			}
		}
	};

	if (useCachedDashboardData) {
		proceed();
	} else {
		getDashboardContents(proceed);
	}
}

function verifySearches(doMobileSearches, callback) {
	changeStatusText("<img src=\"loader.gif\" width=\"16\" height=\"16\"></img> Checking for any missing search credits...", "&nbsp;", "&nbsp;");

	getSearchCreditCount(doMobileSearches, false, function (searchesAreComplete, numberOfNewCredits) {
		// if applicable, update the credit counter
		if (document.getElementById('multipleAccountsOption').checked) {
			updateCreditCounter(dashboardData, false);
		}

		if (doMobileSearches) {
	 		if (!searchesAreComplete) { // mobile searches are incomplete
	 			searchAttemptCount++;

	 			enableMobileMode(function () {
	 				if (stopRunningBingPongFlag) {
	 					// we need to call performThisStep() again to get Bing Pong to stop
	 					disableMobileMode(function () {
	 						closeSearchWindow(function () {
	 							performThisStep(0);
	 						});
	 					});
	 				} else {
	 					// GA tracking
						ga('send', 'event', 'Bing Pong', 'Statistics', 'Searches done', 20 - 2*numberOfNewCredits);

		 				performSearchesBPH(20 - 2*numberOfNewCredits, true, callback);
		 			}
	 			});
	 		} else { // mobile searches are complete
	 			// if applicable, update the account status
	 			if (document.getElementById('multipleAccountsOption').checked) {
	 				document.getElementById('status_ms' + currentAccountIndex).innerHTML = "<i class=\"fa fa-check\"></i>";
	 			}

	 			// return to the caller
	 			closeSearchWindow(function () {
		 			disableMobileMode(function () {
		 				callback();
		 			});
		 		});
	 		}
	 	} else {
	 		if (!searchesAreComplete) { // PC searches are incomplete
	 			searchAttemptCount++;

	 			if (stopRunningBingPongFlag) {
	 				// we need to call performThisStep() again to get Bing Pong to stop
	 				closeSearchWindow(function () {
	 					performThisStep(0);
	 				});
	 			} else {
	 				// GA tracking
					ga('send', 'event', 'Bing Pong', 'Statistics', 'Searches done', numberOfSearchesPerCredit*(creditsToGet - numberOfNewCredits));

		 			performSearchesBPH(numberOfSearchesPerCredit*(creditsToGet - numberOfNewCredits), false, callback);
		 		}
	 		} else { // PC searches are complete
				// if applicable, update the account status
				if (document.getElementById('multipleAccountsOption').checked) {
					document.getElementById('status' + currentAccountIndex).innerHTML = "<i class=\"fa fa-check\"></i>";
				}

	 			// return to caller
	 			closeSearchWindow(callback);
	 		}
	 	}
	});
}

function parseDashboardForTasks(callback) {
	getDashboardContents(function () {
		var temp = dashboardData.split("rewardsapp/redirect?url");
		var temp2 = new Array();

		for (var i = 0; i < temp.length - 1; i++) {
			temp2[i] = "https://www.bing.com/rewardsapp/redirect?url" + temp[i + 1].substring(temp[i + 1].indexOf("="), temp[i + 1].indexOf("\""));
			dashboardTaskURLs[i] = (temp2[i].split("amp;")).join("");
		}

		temp2[temp.length - 1] = "https://www.bing.com/rewardsapp/redirect?url" + temp[temp.length - 1].substring(temp[temp.length - 1].indexOf("="), temp[temp.length - 1].indexOf("\""));
   		dashboardTaskURLs[temp.length - 1] = (temp2[temp.length - 1].split("amp;")).join("");

   		// re-use temp
   		temp = new Array();

   		// remove duplicate task URLs
   		for (var i = 0; i < dashboardTaskURLs.length; i++) {
   			var alreadyInTemp = false;

   			for (var j = 0; j < temp.length; j++) {
   				if (dashboardTaskURLs[i].substring(0, 150) == temp[j].substring(0, 150)) {
   					alreadyInTemp = true;
   					break;
   				}
   			}

   			if (!alreadyInTemp) {
   				temp[temp.length] = dashboardTaskURLs[i];
   			}
   		}

   		// move the elements of temp back into dashboardTaskURLs
   		dashboardTaskURLs = new Array();
   		for (var i = 0; i < temp.length; i++) {
   			dashboardTaskURLs[i] = temp[i];
   		}
/*
   		// tour complete? if not, add it to the list of dashboard tasks
   		if (dashboardData.indexOf("See how it works") != -1) {
   			dashboardTaskURLs.push("https://www.bing.com/rewardsapp/redirect?url=%2frewards%2fdashboard&id=sst_welcome1&hash=f22dc588e49db0572ee93fad4bb5d8f0&state=Active&rcid=4&aid=urlreward&bruid=&ml=&rh=");
   		}
*/
   		// remove the trivia task from the list of tasks to do
   		for (var i = 0; i < dashboardTaskURLs.length; i++) {
   			if (dashboardTaskURLs[i].indexOf("raid=quiz&amp;") != -1) {
   				dashboardTaskURLs.splice(i, 1);
   				break;
   			}
   		}

		// remove any completed tasks from the list of tasks to do
		for (var i = 0; i < dashboardTaskURLs.length; i++) {
			if (dashboardTaskURLs[i].indexOf("state=Completed") != -1) {
				dashboardTaskURLs.splice(i, 1);
			}
		}

   		// return to caller
   		callback();
	});
}


function performDashboardTasks(callback) {
	dashboardTaskAttemptCount++;

	// update the display
	changeStatusText("<img src=\"loader.gif\" width=\"16\" height=\"16\"></img> Performing dashboard tasks...", "&nbsp;", "&nbsp;");

	// request Bing Pong Helper to open the tasks in new tabs, and return to caller when finished
	chrome.runtime.sendMessage(bphExtensionID, {action: "performTasks", taskList: dashboardTaskURLs}, function () {
		if (stopRunningBingPongFlag) {
			// we need to call performThisStep() again to get Bing Pong to stop
			performThisStep(0);
		} else {
			verifyDashboardTasks(callback);
		}
	});
}

function waitForAnIPChange() {
	document.getElementById('remaining').innerHTML = "Current IP: <span id='ipLoader'></span><span id='ipText'></span>";

	var fetchNewIPs = function () {
		if (stopRunningBingPongFlag) {
			// we need to call performThisStep() again to get Bing Pong to stop
			performThisStep(0);
		} else {
			document.getElementById('ipLoader').innerHTML = "<i class=\"fa fa-refresh fa-spin\"></i>";

			performGETRequest("http://ip-api.com/json/?fields=8193", true, function (contents) {
				if (!initialIP && contents.query) { // set the initial IP and poll for new IPs
					initialIP = contents.query;
					document.getElementById('ipText').innerHTML = initialIP;
					document.getElementById('ipLoader').innerHTML = "<img src=\"blue10.png\" width=\"11\" height=\"11\"></img>";
					setTimeout(fetchNewIPs, 5000);
				} else {
					if (!contents.query) {
						setTimeout(fetchNewIPs, 5000);
					} else if (contents.query != initialIP && contents.country == "United States") { // IP has changed and is from the US, so continue
						initialIP = 0;
						document.getElementById('ipLoader').innerHTML = "<i class=\"fa fa-check\"></i>";
						document.getElementById('ipText').innerHTML = contents.query;
						setTimeout(function () {
							performThisStep(0);
						}, 1000);
					} else if (contents.country != "United States") { // non-US IP, so warn user and poll for new IPs
						document.getElementById('ipLoader').innerHTML = "<img src=\"blue10.png\" width=\"11\" height=\"11\"></img>";
						document.getElementById('ipText').innerHTML = "<font color='red'>" + contents.query + '</font>'
						document.getElementById('extra').innerHTML = "(Your IP is not from the United States. Bing Pong will not continue until it gets a US-based IP.)";
						setTimeout(fetchNewIPs, 5000);
					} else {
						setTimeout(fetchNewIPs, 5000);
					}
				}
			});
		}
	}

	fetchNewIPs();
}

function getNumberOfMissingDashboardTasks(includeTrivia, useCachedDashboardData, callback) {
	var proceed = function () {
		var numberOfTasksIncomplete = dashboardData.substring(0, dashboardData.indexOf("Every day ways to earn")).split("check open-check dashboard-sprite").length - 1;

		if (!includeTrivia) {
			numberOfTasksIncomplete -= dashboardData.substring(0, dashboardData.indexOf("Every day ways to earn")).split("raid=quiz&amp;").length - 1;
		}

		callback(numberOfTasksIncomplete);
	};

	if (useCachedDashboardData) {
		proceed();
	} else {
		getDashboardContents(proceed);
	}
}

function verifyDashboardTasks(callback) {
	changeStatusText("<img src=\"loader.gif\" width=\"16\" height=\"16\"></img> Checking for any missing dashboard task credits...", "&nbsp;", "&nbsp;");

	getNumberOfMissingDashboardTasks(false, false, function (numberOfTasksIncomplete) {
		// if applicable, update the credit counter
		if (document.getElementById('multipleAccountsOption').checked) {
			updateCreditCounter(dashboardData, false);
		}

		if (numberOfTasksIncomplete > 0) { // tasks failed
			if (stopRunningBingPongFlag) {
				// we need to call performThisStep() again to get Bing Pong to stop
				performThisStep(0);
			} else {
				performDashboardTasks(callback);
			}
		} else { // tasks successfully completed
			// update the account status if needed
			if (document.getElementById('multipleAccountsOption').checked) {
				document.getElementById('status_dt' + currentAccountIndex).innerHTML = "<i class=\"fa fa-check\"></i>";
			}

			// return to caller
			callback();
		}
	});
}

function verifyAccountInfo(username, password, callbackOnValid, callbackOnInvalid, callbackOnLogoutFailure) {
	logoutOfAccount(function () {
		logIntoAccount(username, password, function () {
			callbackOnValid();
		}, function () {
			callbackOnInvalid();
		}, function () {
			callbackOnInvalid();
		}, function () {
			callbackOnInvalid();
		}, function () {
			callbackOnValid();
		});
	}, function () {
		callbackOnLogoutFailure();
	});
}

function enableSearchOptions() {
	document.getElementById('numberOfDesktopSearches').disabled = false;

	if (bphInstalled) {
		document.getElementById('numberOfMobileSearches').disabled = false;
	}
}

function disableSearchOptions() {
	document.getElementById('numberOfDesktopSearches').disabled = true;
	document.getElementById('numberOfMobileSearches').disabled = true;
}

function enterAutoInSearchBoxes() {
	document.getElementById('numberOfDesktopSearches').value = "auto";
	document.getElementById('numberOfMobileSearches').value = "auto";
}

function disableMobileSearchOption() {
	document.getElementById('numberOfMobileSearches').disabled = true;
	document.getElementById('numberOfMobileSearches').value = "------";
}

function restoreSearchBoxes() {
	// stub
}

function enableSettings() {
	document.getElementById('runBingPongButton').disabled = false;
	document.getElementById('useSearchDelayOption').disabled = false;
	document.getElementById('runOnPageLoadOption').disabled = false;

	if (document.getElementById('useSearchDelayOption').checked) {
		document.getElementById('minSearchDelayTime').disabled = false;
		document.getElementById('minSearchDelayTime').disabled = false;
	}

	// enable the account checkboxes
	if (document.getElementById('multipleAccountsOption').checked) {
		document.getElementById('runInRandomOrderOption').disabled = false;

		if (accountCount) {
			document.getElementById('globalCheckmark').disabled = false;

			for (var i = 1; i <= accountCount; i++) {
				document.getElementById('check' + i).disabled = false;
			}
		}
	}

	if (bphInstalled) {
		// enable dashboard tasks and multiple accounts, since they do not need a license
		document.getElementById('dashboardTasksOption').disabled = false;
		document.getElementById('multipleAccountsOption').disabled = false;
		document.getElementById('pauseOnCaptchaOption').disabled = false; // for now, captcha detection does not need a license

		if (bp.isLicensed || true) {
			// document.getElementById('pauseOnCaptchaOption').disabled = false;

			if (document.getElementById('multipleAccountsOption').checked) {
				document.getElementById('waitForIPChangeOption').disabled = false;
			}

			if (document.getElementById('waitForIPChangeOption').checked) {
				document.getElementById('accountsPerIP').disabled = false;
			}
		}
	}
}

function disableSettings(alsoDisableRunButton) {
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

function hideAccountManagerDisplay() {
	document.getElementById('accountManager').innerHTML = "";
}

function updateAccountManagerDisplay() {
	// document.getElementById('accountManager').innerHTML = "<b>Bing Rewards accounts currently linked with Bing Pong:</b>";
	// document.getElementById('accountManager').innerHTML = "<table class=\"optionsTable\"><tr class=\"optionsTable\"><td class=\"optionsTable\"><select disabled><option>Main account group</option></select><span style=\"float: right\">This group's last run time: <b>N/A</b></span></td><tr class=\"optionsTable\"><td class=\"optionsTable\"><table id=\"accountsTable\"></table></td></tr></table>";
	document.getElementById('accountManager').innerHTML = "<table class=\"optionsTable\"><tr class=\"optionsTable\"><td class=\"optionsTable\"><!--<select disabled><option>Main account group</option></select><span style=\"float: right\">This group's last run time: <b>N/A</b></span>--></td><tr class=\"optionsTable\"><td class=\"optionsTable\"><table id=\"accountsTable\"></table></td></tr></table>";

	if (getCookie("accountCount") && getCookie("accountCount") !== "0") {
		// delete all account data currently stored in the arrays (not in the cookies)
		accountUsernames.length = 0;
		accountPasswords.length = 0;
		accountCredits.length = 0;
		accountRedeemStatuses.length = 0;

		// insert header
		var accountsTable = document.getElementById('accountsTable');
		var headerRow = accountsTable.insertRow(-1);
		var cmHeaderCell = headerRow.insertCell(0);
		var dsHeaderCell = headerRow.insertCell(1);
		var msHeaderCell = headerRow.insertCell(2);
		// var tqHeaderCell = headerRow.insertCell(3);
		var dtHeaderCell = headerRow.insertCell(3);
		var usernameHeaderCell = headerRow.insertCell(4);
		var creditsHeaderCell = headerRow.insertCell(5);
		var optionsHeaderCell = headerRow.insertCell(6);

		cmHeaderCell.innerHTML = "<center><input type=checkbox id=\"globalCheckmark\"  " + ((!getCookie("globalCheck") || getCookie("globalCheck") === "true") ? "checked" : "") + " " + (accountsDone ? "disabled" : "") + " onclick=\"onGlobalCheckmarkChange();\"></center>";
		dsHeaderCell.innerHTML = "<center><i class=\"fa fa-laptop fa-lg\"></i></center>";
		msHeaderCell.innerHTML = "<center><i class=\"fa fa-mobile fa-lg\"></i></center>";
		// tqHeaderCell.innerHTML = "<center><i class=\"fa fa-question-circle fa-lg\"></i></center>";
		dtHeaderCell.innerHTML = "<center><i class=\"fa fa-flag fa-lg\"></i></center>";
		usernameHeaderCell.innerHTML = "<center><b>Usernames</b></center>";
		creditsHeaderCell.innerHTML = "<center><b>Credits</b></center>";
		optionsHeaderCell.innerHTML = "<center><b>Options</b></center>";

		for (var i = 1; i <= getCookie("accountCount"); i++) {
			// populate the rows
			var row = accountsTable.insertRow(-1);
			var checkmarkCell = row.insertCell(0);
			var dsStatusCell = row.insertCell(1);
			var msStatusCell = row.insertCell(2);
			// var tqStatusCell = row.insertCell(3);
			var dtStatusCell = row.insertCell(3);
			var usernameCell = row.insertCell(4);
			var creditsCell = row.insertCell(5);
			var optionsCell = row.insertCell(6);

			checkmarkCell.innerHTML = "<center><input type=checkbox id=\"check" + i + "\" " + ((!getCookie("check" + i) || getCookie("check" + i) === "true") ? "checked" : "") + " " + (accountsDone ? "disabled" : "") + " onclick=\"onAccountCheckmarksChange();\"></center>";
			dsStatusCell.innerHTML = "<center><span id=\"status" + i + "\"><img src=\"../blue10.png\" width=\"10\" height=\"10\"></img></span></center>";
			msStatusCell.innerHTML = "<center><span id=\"status_ms" + i + "\"><img src=\"../blue10.png\" width=\"10\" height=\"10\"></img></span></center>";
			// tqStatusCell.innerHTML = "<center><span id=\"status_tq" + i + "\"><img src=\"../blue10.png\" width=\"10\" height=\"10\"></img></span></center>";;
			dtStatusCell.innerHTML = "<center><span id=\"status_dt" + i + "\"><img src=\"../blue10.png\" width=\"10\" height=\"10\"></img></span></center>";
			usernameCell.innerHTML = "<span id=\"accountName" + i + "\">" + getCookie("username" + i) + "</span>&nbsp;&nbsp;&nbsp;";
			creditsCell.innerHTML = "<center><span id=\"credits" + i + "\"></span></center>";
			optionsCell.innerHTML = "<a href=\"#\" onclick=\"launchDashboardForAccount(" + i + ");return false;\">Dashboard</a>&nbsp;&nbsp;&nbsp;<a href=\"#\" onclick=\"launchEmailForAccount(" + i + ");return false;\">Outlook</a>&nbsp;&nbsp;&nbsp;<a href=\"#\" onclick=\"removeAccount(" + i + ");return false;\">Remove</a>";

			// fetch the account information from the cookies and store them into the arrays for Bing Pong to use
			accountUsernames[i] = getCookie("username" + i);
			accountPasswords[i] = getCookie("password" + i);
			accountCredits[i] = (getCookie("credits" + i) ? getCookie("credits" + i) : "N/A");
			document.getElementById('credits' + i).innerHTML = accountCredits[i];
			accountRedeemStatuses[i] = getCookie("isRedeemable" + i);

			// visually show an accounts redeem status
			document.getElementById('credits' + i).style.color = ((accountRedeemStatuses[i] === "true") ? "#00FF00" : "#FAFAFA");
			document.getElementById('accountName' + i).style.color = ((accountRedeemStatuses[i] === "true") ? "#00FF00" : "#FAFAFA");

			// fetch the value of accountCount
			accountCount = getCookie("accountCount");
		}

		// update the "Run Bing Pong" button to show the number of accounts, but only do it if the but is not running
		if (!accountsDone) {
			changeButtonText("Run Bing Pong (" + accountCount + (accountCount == 1 ? " account" : " accounts") + " configured)");
		}

   		// add a section to add accounts below the account list
   		document.getElementById('accountManager').innerHTML += "</table><br><br>";
		updateAddAccountSection();

		// if an account is not checked, dash it out
		for (var i = 1; i <= accountCount; i++) {
			// only add the account to the list if it is checked
			if (!document.getElementById('check' + i).checked) {
				document.getElementById('status' + i).innerHTML = "<i class=\"fa fa-minus\"></i>";
				document.getElementById('status_ms' + i).innerHTML = "<i class=\"fa fa-minus\"></i>";
				// document.getElementById('status_tq' + i).innerHTML = "<i class=\"fa fa-minus\"></i>";
				document.getElementById('status_dt' + i).innerHTML = "<i class=\"fa fa-minus\"></i>";
			}
		}

		// if there are more than 5 accounts in the list, check for a BPH license
		if (accountCount > 5) {
			if (bp.isLicensed) {
				// do nothing for now
			} else {
				// update the statuses to reflect that Bing Pong will not run anything below the first 5 accounts
				for (var i = 6; i <= accountCount; i++) {
					document.getElementById('check' + i).disabled = true;
					document.getElementById('check' + i).checked = false;
					document.getElementById('status' + i).innerHTML = "<i class=\"fa fa-minus\"></i>";
					document.getElementById('status_ms' + i).innerHTML = "<i class=\"fa fa-minus\"></i>";
					// document.getElementById('status_tq' + i).innerHTML = "<i class=\"fa fa-minus\"></i>";
					document.getElementById('status_dt' + i).innerHTML = "<i class=\"fa fa-minus\"></i>";
					document.getElementById('accountName' + i).innerHTML = "<strike>" + getCookie("username" + i) + "</strike>";
					document.getElementById('credits' + i).innerHTML = "<strike>" + (getCookie("credits" + i) ? getCookie("credits" + i) : "N/A") + "</strike>";
				}
			}
		}
	} else {
		changeButtonText("Run Bing Pong (0 accounts configured)");

		document.getElementById('accountManager').innerHTML = "<br><b>No accounts are currently linked with Bing Pong. Link an account via the options below.</b><br><br>";
		updateAddAccountSection();
   	}
}

function updateAddAccountSection() {
	if (sectionToDisplay == 1) { // add accounts one at a time (with verification)
		document.getElementById('accountManager').innerHTML += "<form name=\"add\"><input type=\"radio\" id=\"manager1\" name=\"add1\" onclick=\"changeAddAccountSection()\" checked>Add one account&nbsp;&nbsp;&nbsp;<input type=\"radio\" id=\"manager2\" name=\"add1\" onclick=\"changeAddAccountSection()\">Add accounts in bulk&nbsp;&nbsp;&nbsp;<input type=\"radio\" id=\"manager3\" name=\"add1\" onclick=\"changeAddAccountSection()\">Export accounts</form><span id=\"accountAdder\"></span>";

		// show the add account section if there are less than 5 accounts linked or if the user has a license
		if (accountCount < 5 || bp.isLicensed) {
			document.getElementById('accountAdder').innerHTML = "<b>Add an account:</b><br>E-mail:<input placeholder=\"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Microsoft Live\" id=\"username\" size=30><br>Password:<input type=\"password\" placeholder=\"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Password\" id=\"password\" size=25><br><input type=button id=\"addAccountButton\" value=\"Add account\" onclick=\"addAccountInManager()\">";
		} else { // not qualified to add more accounts (>5 accounts and no license)
			document.getElementById('accountAdder').innerHTML = "<b>To link another account to Bing Pong, you must either remove an already linked account or purchase a Bing Pong Helper license.<br>You may purchase a license from the Bing Pong Helper options page.</b>";
		}
	} else if (sectionToDisplay == 2) { // add accounts in bulk
		document.getElementById('accountManager').innerHTML += "<form name=\"add\"><input type=\"radio\" id=\"manager1\" name=\"add1\" onclick=\"changeAddAccountSection()\">Add one account&nbsp;&nbsp;&nbsp;<input type=\"radio\" id=\"manager2\" name=\"add1\" onclick=\"changeAddAccountSection()\" checked>Add accounts in bulk&nbsp;&nbsp;&nbsp;<input type=\"radio\" id=\"manager3\" name=\"add1\" onclick=\"changeAddAccountSection()\">Export accounts</form><span id=\"accountAdder\"></span>";

		// check for a license, and only show the account adding section if licensed
		if (bp.isLicensed) {
			document.getElementById('accountAdder').innerHTML = "<b>Add accounts in bulk:</b><br><i>Add each account's information in the format <b>username:password</b> and enter one account per line.<br>(<b>NOTE: The account credentials you supply will not be verified. Make sure they are correct.</b>)</i><br><textarea id=\"bulkField\" rows=8 cols=65></textarea><br><input type=button id=\"bulk_button\" value=\"Add accounts\" onClick=\"addAccountsInBulk()\">";
		} else {
			document.getElementById('accountAdder').innerHTML = "<b>Adding accounts in bulk requires a Bing Pong Helper license.<br>You may purchase a license from the Bing Pong Helper options page.</b>";
		}
	} else { // exporter
		document.getElementById('accountManager').innerHTML += "<form name=\"add\"><input type=\"radio\" id=\"manager1\" name=\"add1\" onclick=\"changeAddAccountSection()\">Add one account&nbsp;&nbsp;&nbsp;<input type=\"radio\" id=\"manager2\" name=\"add1\" onclick=\"changeAddAccountSection()\">Add accounts in bulk&nbsp;&nbsp;&nbsp;<input type=\"radio\" id=\"manager3\" name=\"add1\" onclick=\"changeAddAccountSection()\" checked>Export accounts</form><span id=\"accountAdder\"></span>";
		document.getElementById('accountAdder').innerHTML = "<b>Coming soon...</b>";
	}

	document.getElementById('accountManager').innerHTML += "<br><br><br><br><br>";
}

function changeAddAccountSection() {
	if (document.getElementById('manager1').checked) {
		sectionToDisplay = 1;
	} else if (document.getElementById('manager2').checked) {
		sectionToDisplay = 2;
	} else {
	 	sectionToDisplay = 3;
	}

	updateAccountManagerDisplay();
}

function addAccountInManager() {
	disableSettings(true);
	clearStatusTimeout();
	document.getElementById('username').disabled = true;
	document.getElementById('password').disabled = true;
	document.getElementById('addAccountButton').disabled = true;
	changeStatusText("<img src=\"loader.gif\" width=\"16\" height=\"16\"></img> Verifying account credentials...", "&nbsp;", "&nbsp;");

	addAccount(document.getElementById('username').value, document.getElementById('password').value, true, function () { // successful add
		enableSettings();
		document.getElementById('username').disabled = false;
		document.getElementById('password').disabled = false;
		document.getElementById('addAccountButton').disabled = false;

		changeStatusText(accountUsernames[accountCount] + " has been successfully added to Bing Pong.", "DO_NOT_CHANGE", "DO_NOT_CHANGE");
		statusTimeout = setTimeout(function () {
			changeStatusText(DEFAULT_STATUS_TEXT, "&nbsp;", "&nbsp;");
		}, GOOD_LOGIN_MESSAGE_TIMEOUT);
	}, function () { // bad login info
		enableSettings();
		document.getElementById('username').disabled = false;
		document.getElementById('password').disabled = false;
		document.getElementById('addAccountButton').disabled = false;

		tempSeconds = BAD_LOGIN_WARNING_TIMEOUT;
		changeStatusText("There was is an issue logging into this account.", "Verify that your account is in good standing and try again.", "This message will disappear in " + tempSeconds + " seconds.");
		statusTimeout = setInterval(function () {
			tempSeconds--;

			if (tempSeconds > 1) {
				changeStatusText("DO_NOT_CHANGE", "DO_NOT_CHANGE", "This message will disappear in " + tempSeconds + " seconds.");
			} else if (tempSeconds == 1) {
				changeStatusText("DO_NOT_CHANGE", "DO_NOT_CHANGE", "This message will disappear in 1 second.");
			} else {
				changeStatusText(DEFAULT_STATUS_TEXT, "&nbsp;", "&nbsp;");
				clearStatusTimeout();
			}
		}, 1000);
	}, function () { // logout problems
		enableSettings();
		document.getElementById('username').disabled = false;
		document.getElementById('password').disabled = false;
		document.getElementById('addAccountButton').disabled = false;
		changeStatusText(DEFAULT_STATUS_TEXT, "DO_NOT_CHANGE", "DO_NOT_CHANGE");
		bpAlert("There was an issue logging out of the previous account. Please contact me for further assistance.");
	});
}

function addAccountsInBulk() {
	var fieldLines = (document.getElementById('bulkField').value).split('\n');

   	for (var i = 0; i < fieldLines.length; i++) {
		tempUsername = fieldLines[i].substring(0, fieldLines[i].indexOf(':'));
		tempPassword = fieldLines[i].substring(fieldLines[i].indexOf(':') + 1, fieldLines[i].length);
		var dupAccount = false;

		// check for a duplicate account
		for (var j = 1; j <= accountCount; j++) {
			if (accountUsernames[j] == tempUsername) {
				dupAccount = true;
			}
		}

		if (fieldLines[i].indexOf(':') != -1 && !dupAccount) { // account is fine, so add it
			addAccount(tempUsername, tempPassword, false, function () {});
		} else if (fieldLines[i].indexOf(':') == -1) { // malformed line, so skip this line and all lines after it
			bpAlert("There was a problem parsing line " + (i + 1) + " (" + fieldLines[i] + "). This line and all lines after it have not been parsed.");
			return false;
		} else {
			// do nothing at this time
		}
	}
}

function hideAccountList() {
   document.getElementById('accountinfo').innerHTML = "";
}

function addAccount(username, password, infoNeedsVerification, callbackOnSuccess, callbackOnFailure, callbackOnLogoutFailure) {
	if (infoNeedsVerification) { // account was not "added in bulk"
	 	verifyAccountInfo(username, password, function () { // account successfully verified
	 		var duplicateAccount = false;

	 		// check if this account is already in the list
	 		for (var i = 1; i <= accountCount; i++) {
	 			if (accountUsernames[i] == username) {
	 				duplicateAccount = true;
	 			}
	 		}

	 		if (duplicateAccount) {
	 			bpAlert(username + " is already configured with Bing Pong.");
	 		} else {
	 			// incriment the number of accounts stored in Bing Pong
	 			accountCount++;

	 			// store the new username and password into the internal arrays
	 			accountUsernames[accountCount] = username;
	 			accountPasswords[accountCount] = password;

	 			// store the new username, password, and account count into local storage
	 			setCookie("username" + accountCount, username);
	 			setCookie("password" + accountCount, password);
	 			setCookie("accountCount", accountCount);

	 			// update the account manager display
	 			updateAccountManagerDisplay();

	 			// return to caller
	 			callbackOnSuccess();
	 		}
	 	}, function () { // account failed to verify
	 		// return to caller
	 		callbackOnFailure();
	 	}, function () {
	 		// return to caller
	 		callbackOnLogoutFailure();
		});
	} else { // account was "added in bulk," so do not verify info
		// incriment the number of accounts stored in Bing Pong
	 	accountCount++;

	 	// store the new username and password into the internal arrays
	 	accountUsernames[accountCount] = username;
	 	accountPasswords[accountCount] = password;

	 	// store the new username, password, and account count into local storage
	 	setCookie("username" + accountCount, username);
	 	setCookie("password" + accountCount, password);
	 	setCookie("accountCount", accountCount);

	 	// update the account manager display
	 	updateAccountManagerDisplay();

	 	// return to caller
	 	callbackOnSuccess();
	 }
}

function removeAccount(accountIndex) {
	// delete the corresponding cookies
	deleteCookie("username" + accountIndex);
	deleteCookie("password" + accountIndex);
	deleteCookie("credits" + accountIndex);
	deleteCookie("isRedeemable" + accountIndex);

	// remove account entry #accountIndex from the arrays
	accountUsernames.splice(accountIndex, 1);
	accountPasswords.splice(accountIndex, 1);
	accountCredits.splice(accountIndex, 1);
	accountRedeemStatuses.splice(accountIndex, 1);

	// update the new account count
	accountCount--;
	setCookie("accountCount", accountCount);

	// shift all accounts > accountIndex down to "fill the gap"
	for (var i = 1; i <= accountCount; i++) {
		setCookie("username" + i, accountUsernames[i]);
		setCookie("password" + i, accountPasswords[i]);
		setCookie("credits" + i, accountCredits[i]);
		setCookie("isRedeemable" + i, accountRedeemStatuses[i]);
	}

	// delete the cookie corresponding to the (accountCount + 1)th account
	deleteCookie("username" + (accountCount + 1));
	deleteCookie("password" + (accountCount + 1));
	deleteCookie("credits" + (accountCount + 1));
	deleteCookie("isRedeemable" + (accountCount + 1));

	// update the account manager display
	updateAccountManagerDisplay();
}
