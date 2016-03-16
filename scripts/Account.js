bp.Account = function (user, pass) {
	// constants
	var MAX_LOGIN_ATTEMPTS = 5;
	var MAX_LOGOUT_ATTEMPTS = 5;

	// class variables
	var _username = user;
	var _password = pass;
	var _creditCount = 0;
	var _isRedeemable = false;

	// counters
	var _loginAttemptCount = 0;
	var _logoutAttemptCount = 0;
	
	var a = {};
	
	a.getUsername = function () { 
		return _username;
	}
	
	a.getCreditCount = function () { 
		return _creditCount;
	}
	
	a.getRedeemabilityStatus = function () { 
		return _isRedeemable;
	}

	a.logIn = function (callbackOnSuccess, callbackOnFailure, callbackOnBlocked, callbackOnBanned, callbackOnCaptcha) {
		_loginAttemptCount++;

		if (_loginAttemptCount <= MAX_NUMBER_OF_LOGIN_ATTEMPTS) {
			// log into the account via Bing Pong Helper
			bp.helperTools.logIntoAccount(_username, _password, function () {
				bp.helperTools.openDashboardForVerifying(function () {
					_checkForSuccessfulLogin(callbackOnSuccess, callbackOnFailure, callbackOnBlocked, callbackOnBanned, callbackOnCaptcha);
				});
			});
		} else {
			_loginAttemptCount = 0;
			callbackOnFailure();
		}
	}

	a.logOut = function (callbackOnSuccess, callbackOnFailure) {
		_logoutAttemptCount++;

		if (_logoutAttemptCount <= MAX_NUMBER_OF_LOGOUT_ATTEMPTS) {
			bp.helperTools.logoutOfAccount(function () {
				_checkForSuccessfulLogout(callbackOnSuccess, callbackOnFailure);
			});
		} else {
			_logoutAttemptCount = 0;
			callbackOnFailure();
		}
	}

	function _checkForSuccessfulLogin(callbackOnSuccess, callbackOnFailure, callbackOnBlocked, callbackOnBanned, callbackOnCaptcha) {
		bp.rewardsDashboard.updateDashboardData(function () {
			var dashboardData = bp.rewardsDashboard.getDashboardData();

			if (dashboardData.indexOf("To see your order history, sign in.") != -1 || dashboardData.indexOf("You are not signed in to Bing Rewards.") != -1) { // the dashboard says we are still logged out
				// check to see if the account is just blocked
				bp.helperTools.performGETRequest("https://login.live.com/login.srf?wa=wsignin1.0&wreply=http:%2F%2Fwww.bing.com%2FPassport.aspx%3Frequrl%3Dhttp%253a%252f%252fwww.bing.com%252frewards%252fdashboard", false, function (contents) {
					if (contents.indexOf("/proofs/Verify") != -1 || contents.indexOf("/ar/cancel") != -1 || contents.indexOf("tou/accrue") != -1) { // we are actually logged in, but the account is blocked
						_loginAttemptCount = 0;
						callbackOnBlocked();
					} else { // we are truly logged out, so make another log-in attempt
						logOut(function () { // make another log out attempt just to be sure
							logIn(callbackOnSuccess, callbackOnFailure, callbackOnBlocked, callbackOnBanned, callbackOnCaptcha);
						}, callbackOnFailure);
					}
				});
			} else if (dashboardData.indexOf("/proofs/Verify") != -1 || dashboardData.indexOf("/ar/cancel") != -1 || dashboardData.indexOf("tou/accrue") != -1) { // account is blocked
				_loginAttemptCount = 0;
				callbackOnBlocked();
			} else if (dashboardData.indexOf("Bing Rewards account has been suspended") != -1) { // account is banned
				_loginAttemptCount = 0;
				callbackOnBanned();
			} else if (dashboardData.indexOf("Verify account") != -1) { // logged in, but solving a CAPTCHA is required to do anything useful
				_loginAttemptCount = 0;
				callbackOnCaptcha();
			} else { // all good, so continue
				_loginAttemptCount = 0;
				callbackOnSuccess();
			}
		});
	}

	function _checkForSuccessfulLogout(callbackOnSuccess, callbackOnFailure) {
		bp.helperTools.performGETRequest("https://login.live.com/login.srf?wa=wsignin1.0&wreply=http:%2F%2Fwww.bing.com%2FPassport.aspx%3Frequrl%3Dhttp%253a%252f%252fwww.bing.com%252frewards%252fdashboard", false, function (contents) {
			// (note: a minimum of 2 logout attempts is currently enforced to improve logout rate --- this probably is not necessary, but we will try it)
			if (contents.indexOf("Microsoft account requires JavaScript to sign in.") != -1 && _logoutAttemptCount >= 2) { // logged out
				// return to caller, which will proceed with logging into the account
				_logoutAttemptCount = 0;
				callbackOnSuccess();
			} else { // not logged out, so attempt another logout
				logOut(callbackOnSuccess, callbackOnFailure);
			}
		});
	}

	a.launchDashboard = function () {
		bp.settings.disable();
		bp.status.clearDefaultTimeout();
		bp.status.changeText("<img src=\"loader.gif\" width=\"16\" height=\"16\"></img> Signing in as " + accountUsernames[accountIndex] + "...", "&nbsp;", "&nbsp;");

		logOut(function () {
			logIn(function () { // log-in was successful, so open the dashboard
				bp.helperTools.openDashboard(function () {
					bp.settings.enable();
					bp.status.changeText(DEFAULT_STATUS_TEXT, "&nbsp;", "&nbsp;");
				});
			}, function () { // log-in failed after two attempts
				bp.settings.enable();
				bp.status.changeText("There was is an issue logging into this account.", "Verify that your account is in good standing and try again.", "&nbsp;");

				bp.status.setDefaultTimeout();
				/* = setTimeout(function () {
					changeStatusText(DEFAULT_STATUS_TEXT, "&nbsp;", "&nbsp;");
					clearStatusTimeout();
				}, 5000);*/
			}, function () { // account is blocked
				bp.settings.enable();
				bp.status.changeText("There was is an issue logging into this account.", "This account is blocked and most likely needs SMS verification.", "&nbsp;");
				bp.status.setDefaultTimeout();
			}, function () { // account is banned
				bp.settings.enable();
				bp.status.changeText("There was is an issue logging into this account.", "This account is banned.", "&nbsp;");
				bp.status.setDefaultTimeout();
			}, function () { // account needs to solve a CAPTCHA before being able to get credits, which is okay
				bp.helperTools.openDashboard(function () {
					enableSettings();
					bp.Status.restoreDefault();
					// changeStatusText(DEFAULT_STATUS_TEXT, "&nbsp;", "&nbsp;");
				});
			});
		}, function () { // log-out failed
			bp.settings.enable();
			bp.status.changeText("There was is an issue logging out of the previous account.", "This is a bug, and will need to be reported to get fixed.", "&nbsp;");
			bp.status.setDefaultTimeout();
		});
	}

	a.launchEmail = function () {
		bp.settings.disable();
		bp.status.clearDefaultTimeout();
		bp.status.changeText("<img src=\"loader.gif\" width=\"16\" height=\"16\"></img> Signing in as " + accountUsernames[accountIndex] + "...", "&nbsp;", "&nbsp;");

		logOut(function () {
			logIn(function () { // log-in was successful, so open the dashboard
				bp.helperTools.openDashboard(function () {
					bp.settings.enable();
					bp.status.changeText(DEFAULT_STATUS_TEXT, "&nbsp;", "&nbsp;");
				});
			}, function () { // log-in failed after two attempts
				bp.settings.enable();
				bp.status.changeText("There was is an issue logging into this account.", "Verify that your account is in good standing and try again.", "&nbsp;");

				bp.status.setDefaultTimeout();
				/* = setTimeout(function () {
					changeStatusText(DEFAULT_STATUS_TEXT, "&nbsp;", "&nbsp;");
					clearStatusTimeout();
				}, 5000);*/
			}, function () { // account is blocked
				bp.settings.enable();
				bp.status.changeText("There was is an issue logging into this account.", "This account is blocked and most likely needs SMS verification.", "&nbsp;");
				bp.status.setDefaultTimeout();
			}, function () { // account is banned
				bp.settings.enable();
				bp.status.changeText("There was is an issue logging into this account.", "This account is banned.", "&nbsp;");
				bp.status.setDefaultTimeout();
			}, function () { // account needs to solve a CAPTCHA before being able to get credits, which is okay
				bp.helperTools.openEmail(function () {
					bp.settings.enable();
					bp.status.restoreDefault();
					// changeStatusText(DEFAULT_STATUS_TEXT, "&nbsp;", "&nbsp;");
				});
			});
		}, function () { // log-out failed
			bp.settings.enable();
			bp.status.changeText("There was is an issue logging out of the previous account.", "This is a bug, and will need to be reported to get fixed.", "&nbsp;");
			bp.status.setDefaultTimeout();
		});
	}

	a.launchCaptcha = function () {
		// to-do
	}
	
	return a;
}
