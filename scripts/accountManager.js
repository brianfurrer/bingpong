bp.accountManager = (function () { 
	var ADD_ONE_ACCOUNT_SECTION = 1;
	var ADD_ACCOUNT_BULK_SECTION = 2;
	var EXPORT_ACCOUNTS_SECTION = 3;
	var BAD_LOGIN_WARNING_TIMEOUT = 10;
	var SUCCESSFUL_ADD_TIMEOUT = 5;
	var REDEEMABLE_COLOR = "#00FF00";
	var NOT_REDEEMABLE_COLOR = "#FAFAFA";
	var BLOCKED_COLOR = "#FFFF00";
	var BANNED_COLOR = "#FF0000";
	var RUNNING_INDICATOR_SMALL = "<img src=\"loader.gif\" width=\"10\" height=\"10\"></img>";
	var RUNNING_INDICATOR_NORMAL = "<img src=\"loader.gif\" width=\"16\" height=\"16\"></img>";
	var WARNING_INDICATOR = "<i class=\"fa fa-exclamation-triangle\"></i>";
	var DASHED_INDICATOR = "<i class=\"fa fa-minus\"></i>";
	var BLANK_STATUS = "<img src=\"/blue10.png\" width=\"10\" height=\"10\"></img>";
	
	var _accounts = [];
	var _enabledAccounts = [];
	var _accountsChecked = [];
	var _globalCheckmarkChecked = true;
	
	var accountManager = {};
	
	function _getAccountIndex(account) { 
		for (var i = 0; i < _accounts.length; i++) { 
			if (_accounts[i].getUsername() === account.getUsername()) { 
				return i;
			}
		}
		
		return -1;
	}

	accountManager.getAccountIndex = function (account) { 
		return _getAccountIndex(account); // debugging
	}
	
	accountManager.getAccountAtIndex = function (index) { 
		return _accounts[index];
	}
	
	accountManager.accountIsEnabled = function (account) { 
		var isRunnable = false;
		
		for (var i = 0, l = _enabledAccounts.length; i < l; i++) { 
			if (account.equals(_enabledAccounts[i])) { 
				isRunnable = true;
				break;
			}
		}
		
		return isRunnable;
	}
	
	accountManager.accountIsInManager = function (account) { 
		var isInManager = true;
		
		for (var i = 0, i = _accounts.length; i < l; i++) { 
			if (account.equals(bp.accountManager.getAccountAtIndex(i))) { 
				isInManager = true;
				break;
			}
		}
		
		return isInManager;
	}
	
	accountManager.init = function () { 
		if (bp.cookies.get("accountCount") && bp.cookies.get("accountCount") !== "0") { // there are accounts stored in cookies
			// loop through all the accounts stored
			var numOfAccounts = bp.cookies.get("accountCount");
			
			for (var i = 1; i <= numOfAccounts; i++) { 
				// get the account's information from cookies
				var username = bp.cookies.get("username" + i);
				var password = bp.cookies.get("password" + i);
				var creditCount = bp.cookies.get("credits" + i);
				var isRedeemable = !bp.cookies.get("isRedeemable" + i) || (bp.cookies.get("isRedeemable" + i) === "true");
				var isEnabled = !bp.cookies.get("isEnabled" + i) || (bp.cookies.get("isEnabled") === "true");
				
				// add the account to the account manager
				var account = new bp.Account(username, password);
				account.setCreditCount(creditCount);
				account.setRedeemabilityStatus(isRedeemable);
				bp.accountManager.addAccount(account);

				if (isEnabled && (i <= bp.licensing.MAX_ACCOUNTS_WITHOUT_LICENSE || (i > bp.licensing.MAX_ACCOUNTS_WITHOUT_LICENSE && bp.licensing.getLicenseStatus()))) { // account is enabled and can be added to the runnable list
					// add the account to the runnable list
					_enabledAccounts.push(account);
				} else { // disabled account
					bp.cookies.set("isEnabled" + i, false);
					_globalCheckmarkChecked = false;
				}
			}
			
			// update the account manager display
			bp.accountManager.updateDisplay(false);
		}
	}
	
	accountManager.updateDisplay = function (disableChanges) {
		document.getElementById('accountManager').innerHTML = "<table class=\"optionsTable\"><tr class=\"optionsTable\"><td class=\"optionsTable\"><!--<select disabled><option>Main account group</option></select><span style=\"float: right\">This group's last run time: <b>N/A</b></span>--></td><tr class=\"optionsTable\"><td class=\"optionsTable\"><table id=\"accountsTable\"></table></td></tr></table>";
		
		// get and add all accounts stored in cookies
		if (bp.cookies.get("accountCount") && bp.cookies.get("accountCount") !== "0") { // there are accounts stored in cookies
			// insert header
			var accountsTable = document.getElementById('accountsTable');
			var headerRow = accountsTable.insertRow(-1);
			var cmHeaderCell = headerRow.insertCell(0);
			var dsHeaderCell = headerRow.insertCell(1);
			var msHeaderCell = headerRow.insertCell(2);
			var dtHeaderCell = headerRow.insertCell(3);
			var usernameHeaderCell = headerRow.insertCell(4);
			var creditsHeaderCell = headerRow.insertCell(5);
			var optionsHeaderCell = headerRow.insertCell(6);
			
			cmHeaderCell.innerHTML = "<center><input type=checkbox id=\"globalCheckmark\" " + (_globalCheckmarkChecked ? "checked" : "") + " " + (disableChanges ? "disabled" : "") + " onclick=\"bp.accountManager.onGlobalCheckmarkChange();\"></center>";
			dsHeaderCell.innerHTML = "<center><i class=\"fa fa-laptop fa-lg\"></i></center>";
			msHeaderCell.innerHTML = "<center><i class=\"fa fa-mobile fa-lg\"></i></center>";
			dtHeaderCell.innerHTML = "<center><i class=\"fa fa-flag fa-lg\"></i></center>";
			usernameHeaderCell.innerHTML = "<center><b>Usernames</b></center>";
			creditsHeaderCell.innerHTML = "<center><b>Credits</b></center>";
			optionsHeaderCell.innerHTML = "<center><b>Options</b></center>";
			
			// loop through the accounts stored
			for (var i = 1, accountCount = parseInt(bp.cookies.get("accountCount")); i <= accountCount; i++) { 
				// get the account's information from cookies
				var username = bp.cookies.get("username" + i);
				var password = bp.cookies.get("password" + i);
				var creditCount = bp.cookies.get("credits" + i);
				var isEnabled = bp.cookies.get("isEnabled" + i);
				
				// sanitize the credit count and account enable/disable status
				creditCount = (creditCount && creditCount >= 0) ? creditCount : "N/A";
				isEnabled = (!isEnabled || isEnabled === "true");

				// populate the rows
				var row = accountsTable.insertRow(-1);
				var checkmarkCell = row.insertCell(0);
				var dsStatusCell = row.insertCell(1);
				var msStatusCell = row.insertCell(2);
				var dtStatusCell = row.insertCell(3);
				var usernameCell = row.insertCell(4);
				var creditsCell = row.insertCell(5);
				var optionsCell = row.insertCell(6);

				checkmarkCell.innerHTML = "<center><input type=checkbox id=\"check" + i + "\" " + (isEnabled ? "checked" : "") + " " + (disableChanges ? "disabled" : "") + " onclick=\"bp.accountManager.onAccountCheckmarkChange(" + i + ");\"></center>";
				dsStatusCell.innerHTML = "<center><span id=\"status" + i + "\">" + BLANK_STATUS + "</span></center>";
				msStatusCell.innerHTML = "<center><span id=\"status_ms" + i + "\">" + BLANK_STATUS + "</span></center>";
				dtStatusCell.innerHTML = "<center><span id=\"status_dt" + i + "\">" + BLANK_STATUS + "</span></center>";
				usernameCell.innerHTML = "<span id=\"accountName" + i + "\">" + username + "</span>&nbsp;&nbsp;&nbsp;";
				creditsCell.innerHTML = "<center><span id=\"credits" + i + "\">" + creditCount + "</span></center>";
				optionsCell.innerHTML = "<a href=\"#\" onclick=\"bp.accountManager.launchDashboardForAccountAtIndex(" + i + ");return false;\">Dashboard</a>&nbsp;&nbsp;&nbsp;"
				optionsCell.innerHTML += "<a href=\"#\" onclick=\"bp.accountManager.launchEmailForAccountAtIndex(" + i + ");return false;\">Outlook</a>&nbsp;&nbsp;&nbsp;";
				optionsCell.innerHTML += "<a href=\"#\" onclick=\"bp.accountManager.removeAccountAtIndex(" + i + ");return false;\">Remove</a>";
				
				// check for a license beyond the 5th account
				if (i > bp.licensing.MAX_ACCOUNTS_WITHOUT_LICENSE && !bp.licensing.getLicenseStatus()) { // > 5 accounts without a license
					// dash out the 6th account and beyond when there is no license
					document.getElementById('status' + i).innerHTML = DASHED_INDICATOR;
					document.getElementById('status_ds' + i).innerHTML = DASHED_INDICATOR;
					document.getElementById('status_ms' + i).innerHTML = DASHED_INDICATOR;
					document.getElementById('status_dt' + i).innerHTML = DASHED_INDICATOR;
					document.getElementById('accountName' + i).innerHTML = "<strike>" + username + "</strike>";
					document.getElementById('credits' + i).innerHTML = "<strike>" + credits + "</strike>";
				}
				
				// mark qualifying accounts as redeemable
				if (isRedeemable) { 
					bp.accountManager.markAccountAsRedeemable(account);
				}
				
				// set the run button text
				bp.button.setText("Run Bing Pong (" + accountCount + (accountCount === 1 ? " account" : " accounts") + " configured)");
			}
		} else { // no accounts linked
			bp.button.setText("Run Bing Pong (0 accounts configured)");
			document.getElementById('accountManager').innerHTML = "<br><b>No accounts are currently linked with Bing Pong. Link an account via the options below.</b><br><br>";
		}
		
		if (document.getElementById('managerSelector1')) { // add account section exists already
			if (document.getElementById('managerSelector1').checked) { 
				bp.accountManager.updateAddAccountSection(ADD_ONE_ACCOUNT_SECTION);
			} else if (document.getElementById('managerSelector2').checked) { 
				bp.accountManager.updateAddAccountSection(ADD_ACCOUNTS_BULK_SECTION);
			} else {
				bp.accountManager.updateAddAccountSection(EXPORT_ACCOUNTS_SECTION);
			}
		} else { // doesn't exist
			// create it and default to the "add one account" section
			bp.accountManager.updateAddAccountSection(ADD_ONE_ACCOUNT_SECTION);
		}
	}
	
	accountManager.updateAddAccountSection = function (sectionToDisplay) { 
		if (sectionToDisplay === ADD_ONE_ACCOUNT_SECTION) { // add accounts one at a time (with verification)
			document.getElementById('accountManager').innerHTML += "<form name=\"add\"><input type=\"radio\" id=\"managerSelector1\" name=\"add1\" onclick=\"bp.accountManager.changeAddAccountSection(1)\" checked>Add one account&nbsp;&nbsp;&nbsp;<input type=\"radio\" id=\"managerSelector2\" name=\"add1\" onclick=\"bp.accountManager.changeAddAccountSection(2)\">Add accounts in bulk&nbsp;&nbsp;&nbsp;<input type=\"radio\" id=\"managerSelector3\" name=\"add1\" onclick=\"bp.accountManager.changeAddAccountSection(3)\">Export accounts</form><span id=\"accountAdder\"></span>";

			// show the add account section if there are less than 5 accounts linked or if the user has a license
			if (_accounts.length < bp.licensing.MAX_ACCOUNTS_WITHOUT_LICENSE || bp.licensing.getLicenseStatus()) {
				document.getElementById('accountAdder').innerHTML = "<b>Add an account:</b><br>E-mail:<input placeholder=\"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Microsoft Live\" id=\"username\" size=30><br>Password:<input type=\"password\" placeholder=\"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Password\" id=\"password\" size=25><br><input type=button id=\"addAccountButton\" value=\"Add account\" onclick=\"addAccountInManager()\">";
			} else { // not qualified to add more accounts (>5 accounts and no license)
				document.getElementById('accountAdder').innerHTML = "<b>To link another account to Bing Pong, you must either remove an already linked account or purchase a Bing Pong Helper license.<br>You may purchase a license from the Bing Pong Helper options page.</b>";
			}
		} else if (sectionToDisplay === ADD_ACCOUNTS_BULK_SECTION) { // add accounts in bulk
			document.getElementById('accountManager').innerHTML += "<form name=\"add\"><input type=\"radio\" id=\"managerSelector1\" name=\"add1\" onclick=\"changeAddAccountSection()\">Add one account&nbsp;&nbsp;&nbsp;<input type=\"radio\" id=\"managerSelector2\" name=\"add1\" onclick=\"changeAddAccountSection()\" checked>Add accounts in bulk&nbsp;&nbsp;&nbsp;<input type=\"radio\" id=\"managerSelector3\" name=\"add1\" onclick=\"changeAddAccountSection()\">Export accounts</form><span id=\"accountAdder\"></span>";

			// check for a license, and only show the account adding section if licensed
			if (bp.licensing.getLicenseStatus()) {
				document.getElementById('accountAdder').innerHTML = "<b>Add accounts in bulk:</b><br><i>Add each account's information in the format <b>username:password</b> and enter one account per line.<br>(<b>NOTE: The account credentials you supply will not be verified. Make sure they are correct.</b>)</i><br><textarea id=\"bulkField\" rows=8 cols=65></textarea><br><input type=button id=\"bulk_button\" value=\"Add accounts\" onClick=\"addAccountsInBulk()\">";
			} else {
				document.getElementById('accountAdder').innerHTML = "<b>Adding accounts in bulk requires a Bing Pong Helper license.<br>You may purchase a license from the Bing Pong Helper options page.</b>";
			}
		} else { // exporter
			document.getElementById('accountManager').innerHTML += "<form name=\"add\"><input type=\"radio\" id=\"managerSelector1\" name=\"add1\" onclick=\"changeAddAccountSection()\">Add one account&nbsp;&nbsp;&nbsp;<input type=\"radio\" id=\"managerSelector2\" name=\"add1\" onclick=\"changeAddAccountSection()\">Add accounts in bulk&nbsp;&nbsp;&nbsp;<input type=\"radio\" id=\"managerSelector3\" name=\"add1\" onclick=\"changeAddAccountSection()\" checked>Export accounts</form><span id=\"accountAdder\"></span>";
			document.getElementById('accountAdder').innerHTML = "<b>Coming soon...</b>";
		}

		document.getElementById('accountManager').innerHTML += "<br><br><br><br><br>";
	}

	function _addAccount(account) { 
		// add account to list
		_accounts.push(account);
		_enabledAccounts.push(account);
		
		// update the cookies to reflect the new account
		var newAccountCount = _accounts.length;
		bp.cookies.set("username" + newAccountCount, account.getUsername());
		bp.cookies.set("password" + newAccountCount, account.getPassword());
		bp.cookies.set("isEnabled" + newAccountCount, true);
		bp.cookies.set("credits" + i, account.getCreditCount());
		bp.cookies.set("accountCount", newAccountCount);
		
		// update the account manager display
		bp.accountManager.updateDisplay(false);
	}
	
	accountManager.addAccountInManager = function (account, verifyBeforeAdding) { 
		if (verifyBeforeAdding) { 
			bp.settings.disable(true);
			bp.accountManager.disable();
			bp.status.change(RUNNING_INDICATOR_NORMAL + " Verifying account credentials...", "&nbsp;", "&nbsp;");
			
			account.verifyInfo(function () { // account info has been verified
				bp.accountManager.enable();
				
				if (accountManager.accountIsInManager(account)) { // account has already been added
					bp.status.reset();
					bph.externalTools.alert(account.getUsername() + " is already configured with Bing Pong.");
				} else {
					_addAccount(account);
					bp.status.changeWithTimeout(account.getUsername() + " has been successfully added to Bing Pong.", "&nbsp;", "&nbsp;", SUCCESSFUL_ADD_TIMEOUT, function () {});
				}
			}, function () { // account info is invalid
				bp.status.reset();
				bp.accountManager.enable();
				bp.status.changeWithTimeout("There was an issue logging into this account.", "Verify that your account is in good standing and try again.", "This message will disappear in %d second(s).", BAD_LOGIN_WARNING_TIMEOUT, function () {});
			}, function () { // log-out issues
				bp.status.reset();
				bp.accountManager.enable();
				bph.externalTools.alert("There was an issue logging out of the previous account. Please contact me for further assistance.");
			});
		} else {
			_addAccount(account);
		}
	}
	
	accountManager.addAccountsInBulk = function () {
		var fieldLines = (document.getElementById('bulkField').value).split('\n');

		for (var i = 0; i < fieldLines.length; i++) {
			var username = fieldLines[i].substring(0, fieldLines[i].indexOf(':'));
			var password = fieldLines[i].substring(fieldLines[i].indexOf(':') + 1, fieldLines[i].length);
			var account = new bp.Account(username, password);
			
			if (accountManager.accountIsInManager(account)) { // account is a duplicate
				// ignore for now
			} else {
				if (fieldLines[i].indexOf(":") !== -1) { // account is fine
					_addAccount(account);
				} else {
					bph.externalTools.alert("There was a problem parsing line " + (i + 1) + " (" + fieldLines[i] + "). This line and all lines after it have not been parsed.");
					return false;
				}
			}
		}
	}
	
	accountManager.removeAccount = function (account) {
		var accountIndex = _getAccountIndex(account);
		var oldAccountCount = _accounts.length;
		
		// remove account from list
		_accounts.splice(accountIndex, 1);
		
		// delete the corresponding cookies
		bp.cookies.remove("username" + (accountIndex + 1));
		bp.cookies.remove("password" + (accountIndex + 1));
		bp.cookies.remove("credits" + (accountIndex + 1));
		bp.cookies.remove("isRedeemable" + (accountIndex + 1));
		bp.cookies.remove("isEnabled" + (accountIndex + 1));
		
		// remove the account from the list
		_accounts.splice(accountIndex, 1);

		// update the new account count
		bp.cookies.set("accountCount", _accounts.length);

		// re-initialize the cookies with the new account data
		for (var i = 0, l = _accounts.length; i < l; i++) {
			bp.cookies.set("username" + (i + 1), _account[i].getUsername());
			bp.cookies.set("password" + (i + 1), _account[i].getPassword());
			bp.cookies.set("credits" + (i + 1), _account[i].getCreditCount());
			// bp.cookies.set("isRedeemable" + (i + 1)); to what???
			// bp.cookies.set("isEnabled" + (i + 1)); to what???
		}

		// delete the cookie corresponding to the old account
		bp.cookies.remove("username" + oldAccountCount);
		bp.cookies.remove("password" + oldAccountCount);
		bp.cookies.remove("credits" + oldAccountCount);
		bp.cookies.remove("isRedeemable" + oldAccountCount);
		bp.cookies.remove("isEnabled" + oldAccountCount);
		
		// update the account manager display
		bp.accountManager.updateDisplay(false);
	}
	
	accountManager.removeAccountAtIndex = function (index) { 
		accountManger.removeAccount(bp.accountManager.getAccountAtIndex(index));
	}
	
	accountManager.disableAccountAtIndex = function (index) { 
		// remove the account from the runnable array
		_enabledAccounts.splice(index, 1);
		
		// update enabled cookie
		bp.cookies.set("isEnabled" + index, false);
		
		// update global checkmark
		_globalCheckmarkChecked = false;
	}
	
	accountManager.enableAccountAtIndex = function (index) { 
		// add account to runnable list
		_enabledAccounts.push(bp.accountManager.getAccountAtIndex(index));
		
		// update enabled cookie
		bp.cookies.set("isEnabled" + index, true);
		
		// update global checkmark if necessary
		if (_enabledAccounts.length === _accounts.length) { // same number of accounts
			_globalCheckmarkChecked = true;
		}
	}
	
	accountManager.launchDashboardForAccountAtIndex = function (index) { 
		bp.accountManager.getAccountAtIndex(index).launchDashboard();
	}
	
	accountManager.launchEmailForAccountAtIndex = function (index) { 
		bp.accountManager.getAccountAtIndex(index).launchEmail();
	}
	
	accountManager.updateAccountWithDashboardData = function (account) { 
		var index = _getAccountIndex(account);
		var dashboardData = bp.rewardsDashboard.getDashboardData();
		var newCreditCount = dashboardData.match(/(?:<span class="credits-left"><div class="credits" title=")(\d+)(?:">)/)[1];
		var isRedeemable = (data.indexOf("<div class=\"progress-percentage\">100%") == -1);
		
		// update the account with the new data
		account.setCreditCount(newCreditCount);
		account.setRedeemabilityStatus(isRedeemable);
		
		// update the display
		document.getElementById('credits' + index).innerHTML = account.getCreditCount();
		document.getElementById('credits' + index).style.color = (isRedeemable ? REDEEMABLE_COLOR : NOT_REDEEMABLE_COLOR);
		document.getElementById('accountName' + index).style.color = (isRedeemable ? REDEEMABLE_COLOR : NOT_REDEEMABLE_COLOR);
		
		// update storage
		bp.cookies.set("credits" + index, account.getCreditCount());
		bp.cookies.set("isRedeemable" + index, account.getRedeemablityStatus());
	}
	
	accountManager.markAccountAsBlocked = function (acount) {
		var index = _getAccountIndex(account);

		document.getElementById('status' + index).innerHTML = WARNING_INDICATOR;
		document.getElementById('status_ms' + index).innerHTML = WARNING_INDICATOR;
		document.getElementById('status_dt' + index).innerHTML = WARNING_INDICATOR;
		document.getElementById('status' + index).innerHTML = WARNING_INDICATOR;
		document.getElementById('credits' + index).style.color = BLOCKED_COLOR;
		document.getElementById('accountName' + index).style.color = BLOCKED_COLOR;
		document.getElementById('credits' + index).innerHTML = "BLOCKED";
	}
	
	accountManager.markAccountAsBanned = function (account) {
		var index = _getAccountIndex(account);
		
		document.getElementById('status' + index).innerHTML = WARNING_INDICATOR;
		document.getElementById('status_ms' + index).innerHTML = WARNING_INDICATOR;
		document.getElementById('status_dt' + index).innerHTML = WARNING_INDICATOR;
		document.getElementById('status' + index).innerHTML = WARNING_INDICATOR;
		document.getElementById('credits' + index).style.color = BANNED_COLOR;
		document.getElementById('accountName' + index).style.color = BANNED_COLOR;
		document.getElementById('credits' + index).innerHTML = "BANNED!!!";		
	}

	accountManager.markAccountAsProblematic = function (account) {
		var index = _getAccountIndex(account);
		
		document.getElementById('status' + index).innerHTML = WARNING_INDICATOR;
		document.getElementById('status_ms' + index).innerHTML = WARNING_INDICATOR;
		document.getElementById('status_dt' + index).innerHTML = WARNING_INDICATOR;
		document.getElementById('status' + index).innerHTML = WARNING_INDICATOR;
		document.getElementById('credits' + index).style.color = BANNED_COLOR;
		document.getElementById('accountName' + index).style.color = BANNED_COLOR;
		document.getElementById('credits' + index).innerHTML = "???";		
	}
	
	accountManager.markAccountAsRedeemable = function (account) {
		var index = _getAccountIndex(account);
		
		document.getElementById('accountName' + index).style.color = REDEEMABLE_COLOR;
		document.getElementById('credits' + index).style.color = REDEEMABLE_COLOR;
	}
	
	accountManager.markAccountAsNotRedeemable = function (account) { 
		var index = _getAccountIndex(account);
		
		document.getElementById('accountName' + index).style.color = NOT_REDEEMABLE_COLOR;
		document.getElementById('credits' + index).style.color = NOT_REDEEMABLE_COLOR;
	}
	
	accountManager.onAccountCheckmarkChange = function (index) { 
		// update the account's enabled status
		bp.cookies.set("isEnabled" + index, document.getElementById('check' + index).checked);
		
		// check to see if all accounts are checked, and check the global checkmark if so
		_globalCheckmarkChecked = true; // assume all accounts are checked
		
		for (var i = 0, l = _accounts.length; i < l; i++) { 
			if (!bp.cookies.get("isEnabled" + i) || bp.cookies.get("isEnabled" + i) === "false") { // unchecked account
				_globalCheckmarkChecked = false;
			}
		}
		
		// update the global checkmark
		bp.cookies.set("globalCheck", _globalCheckmarkChecked);
		document.getElementById('globalCheck').checked = _globalCheckmarkChecked;
		
		// update the account manager display
		bp.accountManager.updateDisplay(false);
	}
	
	accountManager.onGlobalCheckmarkChange = function () { 
		// update the global checkmark status
		_globalCheckmarkChecked = document.getElementById('globalCheckmark').checked;
		
		if (_globalCheckmarkChecked) { 
			if (bp.licensing.getLicenseStatus()) { // licensed
				// enable every account in the list
				for (var i = 0, l = _accounts.length; i < l; i++) { 
					bp.cookies.set("check" + i, true);
				}
			} else { // unlicensed
				// enable up to the first five accounts
				for (var i = 0, l = Math.min(_accounts.length, bp.licensing.MAX_ACCOUNTS_WITHOUT_LICENSE); i < l; i++) { 
					bp.cookies.set("check" + i, true);
				}
			}
		}
	}
	
	accountManager.disable = function () { 
		// account manager selectors
		document.getElementById('managerSection1').disabled = true;
		document.getElementById('managerSection2').disabled = true;
		document.getElementById('managerSection3').disabled = true;
		
		// "add account" section
		try {
			document.getElementById('username').disabled = true;
			document.getElementById('password').disabled = true;
			document.getElementById('addAccountButton').disabled = true;
		} catch (e) {};
		
		// "add accounts in bulk" section
		try {
			document.getElementById('bulkField').disabled = true;
			document.getElementById('bulk_button').disabled = true;
		} catch (e) {};
		
		// "export accounts section" section
		try {
			document.getElementById('exportedAccounts').disabled = true;
			document.getElementById('exportAccounts').disabled = true;
		} catch (e) {};
	}
		
	accountManager.enable = function () { 
		// account manager selectors
		document.getElementById('managerSection1').disabled = false;
		document.getElementById('managerSection2').disabled = false;
		document.getElementById('managerSection3').disabled = false;
		
		// "add account" section
		try {
			document.getElementById('username').disabled = false;
			document.getElementById('password').disabled = false;
			document.getElementById('addAccountButton').disabled = false;
		} catch (e) {};
		
		// "add accounts in bulk" section
		try {
			document.getElementById('bulkField').disabled = false;
			document.getElementById('bulk_button').disabled = false;
		} catch (e) {};
		
		// "export accounts section" section
		try {
			document.getElementById('exportedAccounts').disabled = false;
			document.getElementById('exportAccounts').disabled = false;
		} catch (e) {};
	}	
	
	accountManager.remove = function () { 
		document.getElementById('accountinfo').innerHTML = "";
	}
	
	return accountManager;
})();
		
		