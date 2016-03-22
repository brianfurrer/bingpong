bp.Account = function (user, pass) {
	var NOT_CHECKED = -1;
	var STATUS_RESET_TIMEOUT = 5;
	
	// constants
	var MAX_LOGIN_ATTEMPTS = 5;
	var MAX_LOGOUT_ATTEMPTS = 5;

	// class variables
	var _username = user;
	var _password = pass;
	var _creditCount = NOT_CHECKED;
	var _isRedeemable = NOT_CHECKED;

	// counters
	var _loginAttemptCount = 0;
	var _logoutAttemptCount = 0;
	
	var account = {};
	
	account.getUsername = function () { 
		return _username;
	}
	
	account.getPassword = function () { 
		return _password;
	}
	
	account.getCreditCount = function () { 
		return _creditCount;
	}
	
	account.setCreditCount = function (creditCount) { 
		_creditCount = creditCount;
	}
	
	account.setRedeemabilityStatus = function (isRedeemable) { 
		_isRedeemable = isRedeemable;
	}
	
	account.getRedeemabilityStatus = function () { 
		return _isRedeemable;
	}
	
	account.equals = function (otherAccount) { 
		return (otherAccount.getUsername() === _username && otherAccount.getPassword() === _password);
	}

	// public version
	account.logIn = function (callbackOnSuccess, callbackOnFailure, callbackOnBlocked, callbackOnBanned, callbackOnCaptcha) {
		_loginAttemptCount = 0;
		_logIn(callbackOnSuccess, callbackOnFailure, callbackOnBlocked, callbackOnBanned, callbackOnCaptcha);
	}
	
	// private version
	function _logIn(callbackOnSuccess, callbackOnFailure, callbackOnBlocked, callbackOnBanned, callbackOnCaptcha) {
		_loginAttemptCount++;

		if (_loginAttemptCount <= MAX_NUMBER_OF_LOGIN_ATTEMPTS) {
			// log into the account via Bing Pong Helper
			bp.helperTools.logIntoAccount(_username, _password, function () {
				bp.helperTools.openDashboardForVerifying(function () {
					_checkForSuccessfulLogin(callbackOnSuccess, callbackOnFailure, callbackOnBlocked, callbackOnBanned, callbackOnCaptcha);
				});
			});
		} else {
			callbackOnFailure();
		}
	}

	// public version
	account.logOut = function (callbackOnSuccess, callbackOnFailure) {
		_logoutAttemptCount = 0;
		_logOut(callbackOnSuccess, callbackOnFailure);
	}
	
	// private version
	function _logOut(callbackOnSuccess, callbackOnFailure) {
		_logoutAttemptCount++;

		if (_logoutAttemptCount <= MAX_NUMBER_OF_LOGOUT_ATTEMPTS) {
			bp.helperTools.logoutOfAccount(function () {
				_checkForSuccessfulLogout(callbackOnSuccess, callbackOnFailure);
			});
		} else {
			callbackOnFailure();
		}
	}		

	function _checkForSuccessfulLogin(callbackOnSuccess, callbackOnFailure, callbackOnBlocked, callbackOnBanned, callbackOnCaptcha) {
		bp.rewardsDashboard.updateDashboardData(function (dashboardData) {
			if (dashboardData.indexOf("To see your order history, sign in.") != -1 || dashboardData.indexOf("You are not signed in to Bing Rewards.") != -1) { // the dashboard says we are still logged out
				// check to see if the account is just blocked
				bp.helperTools.performGETRequest("https://login.live.com/login.srf?wa=wsignin1.0&wreply=http:%2F%2Fwww.bing.com%2FPassport.aspx%3Frequrl%3Dhttp%253a%252f%252fwww.bing.com%252frewards%252fdashboard", false, function (contents) {
					if (contents.indexOf("/proofs/Verify") != -1 || contents.indexOf("/ar/cancel") != -1 || contents.indexOf("tou/accrue") != -1) { // we are actually logged in, but the account is blocked
						callbackOnBlocked();
					} else { // we are truly logged out, so make another log-in attempt
						_logOut(function () { // make another log out attempt just to be sure
							_logIn(callbackOnSuccess, callbackOnFailure, callbackOnBlocked, callbackOnBanned, callbackOnCaptcha);
						}, callbackOnFailure);
					}
				});
			} else if (dashboardData.indexOf("/proofs/Verify") != -1 || dashboardData.indexOf("/ar/cancel") != -1 || dashboardData.indexOf("tou/accrue") != -1) { // account is blocked
				callbackOnBlocked();
			} else if (dashboardData.indexOf("Bing Rewards account has been suspended") != -1) { // account is banned
				callbackOnBanned();
			} else if (dashboardData.indexOf("Verify account") != -1) { // logged in, but solving a CAPTCHA is required to do anything useful
				callbackOnCaptcha();
			} else { // all good, so continue
				callbackOnSuccess();
			}
		});
	}

	function _checkForSuccessfulLogout(callbackOnSuccess, callbackOnFailure) {
		bp.helperTools.performGETRequest("https://login.live.com/login.srf?wa=wsignin1.0&wreply=http:%2F%2Fwww.bing.com%2FPassport.aspx%3Frequrl%3Dhttp%253a%252f%252fwww.bing.com%252frewards%252fdashboard", false, function (contents) {
			// (note: a minimum of 2 logout attempts is currently enforced to improve logout rate --- this probably is not necessary, but we will try it)
			if (contents.indexOf("Microsoft account requires JavaScript to sign in.") != -1 && _logoutAttemptCount >= 2) { // logged out
				// return to caller, which will proceed with logging into the account
				callbackOnSuccess();
			} else { // not logged out, so attempt another logout
				_logOut(callbackOnSuccess, callbackOnFailure);
			}
		});
	}

	account.verifyInfo = function (callbackOnValid, callbackOnInvalid, callbackOnLogoutFailure) { 
		account.logOut(function () { // log-out successful
			account.logIn(function () { // successful log-in
				callbackOnValid();
			}, function () { // log-in failed
				callbackOnInvalid();
			}, function () { // log-in succeeded, but the account is blocked
				callbackOnInvalid();
			}, function () { // log-in succeeded, but the account is banned
				callbackOnInvalid();
			}, function () { // log-in succeeded, but there is a CAPTCHA on the dashboard to solve before doing anything useful
				callbackOnValid();
			});
		}, function () { // log-out failed
			callbackOnLogoutFailure();
		});
	}
	
	account.launchDashboard = function (callbackOnSuccess, callbackOnFailure, callbackOnBlocked, callbackOnBanned, callbackOnLogoutFailure) {
		_logOut(function () {
			_logIn(function () { // log-in was successful, so open the dashboard
				bp.helperTools.openDashboard(callbackOnSuccess);
			}, function () { // log-in failed after two attempts
				callbackOnFailure();
			}, function () { // account is blocked
				callbackOnBlocked();
			}, function () { // account is banned
				callbackOnBanned();
			}, function () { // account needs to solve a CAPTCHA before being able to get credits, which is okay
				bp.helperTools.openDashboard(callbackOnSuccess);
			});
		}, function () { // log-out failed
			callbackOnLogoutFailure();
		});
	}

	account.launchOutlook = function (callbackOnSuccess, callbackOnFailure, callbackOnBlocked, callbackOnBanned, callbackOnLogoutFailure) {
		_logOut(function () {
			_logIn(function () { // log-in was successful, so open the dashboard
				bp.helperTools.openOutlook(callbackOnSuccess);
			}, function () { // log-in failed after two attempts
				callbackOnFailure();
			}, function () { // account is blocked
				callbackOnBlocked();
			}, function () { // account is banned
				callbackOnBanned();
			}, function () { // account needs to solve a CAPTCHA before being able to get credits, which is okay
				bp.helperTools.openOutlook(callbackOnSuccess);
			});
		}, function () { // log-out failed
			callbackOnLogoutFailure();
		});
	}

	account.launchCaptcha = function () {
		// to-do
	}
	
	return account;
}
