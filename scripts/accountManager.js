bp.accountManager = (function () { 
	var MAX_ACCOUNTS_WITHOUT_LICENSE = 5;
	var REDEEMABLE_COLOR = "#00F00";
	var NOT_REDEEMABLE_COLOR = "#FAFAFA";
	var BLOCKED_COLOR = "#FFFF00";
	var BANNED_COLOR = "#FF0000";
	var RUNNING_INDICATOR = "<img src=\"loader.gif\" width=\"10\" height=\"10\"></img>";
	var WARNING_INDICATOR = "<i class=\"fa fa-exclamation-triangle\"></i>";
	var DASHED_INDICATOR = "<i class=\"fa fa-minus\"></i>";
	var BLANK_STATUS = "<img src=\"/blue10.png\" width=\"10\" height=\"10\"></img>";
	
	var _accounts = [];
	var _runnableAccounts = [];
	var _accountsChecked = [];
	var _globalAccountCheckmarkChecked = true;
	
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
	
	accountManager.init = function () { 
		if (bp.cookies.get("accountCount") && bp.cookies.get("accountCount") !== "0") { // there are accounts stored in cookies
			// loop through all the accounts stored
			for (var i = 1; i <= bp.cookies.get("accountCount"); i++) { 
				// get the account's information from cookies
				var username = bp.cookies.get("username" + i);
				var password = bp.cookies.get("password" + i);
				var creditCount = bp.cookies.get("credits" + i);
				var isEnabled = !bp.cookies.get("isEnabled" + i) || (bp.cookies.get("isEnabled") === "true");
				
				// add the account to the account manager
				var account = new bp.Account(username, password);
				accountManager.addAccount(account);
				account.setCreditCount(creditCount);

				if (!isEnabled) { // an account is disabled
					// so uncheck the global checkmark
					_globalAccountCheckmarkChecked = false;
				}
			}
			
			// update the account manager display
			accountManager.updateDisplay(false);
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
			
			cmHeaderCell.innerHTML = "<center><input type=checkbox id=\"globalCheckmark\"  " + (_globalAccountCheckmarkChecked ? "checked" : "") + " " + (disableChanges ? "disabled" : "") + " onclick=\"bp.accountManager.onGlobalCheckmarkChange();\"></center>";
			dsHeaderCell.innerHTML = "<center><i class=\"fa fa-laptop fa-lg\"></i></center>";
			msHeaderCell.innerHTML = "<center><i class=\"fa fa-mobile fa-lg\"></i></center>";
			dtHeaderCell.innerHTML = "<center><i class=\"fa fa-flag fa-lg\"></i></center>";
			usernameHeaderCell.innerHTML = "<center><b>Usernames</b></center>";
			creditsHeaderCell.innerHTML = "<center><b>Credits</b></center>";
			optionsHeaderCell.innerHTML = "<center><b>Options</b></center>";
			
			// loop through the accounts stored
			for (var i = 1; i <= bp.cookies.get("accountCount"); i++) { 
				// get the account's information from cookies
				var username = bp.cookies.get("username" + i);
				var password = bp.cookies.get("password" + i);
				var creditCount = bp.cookies.get("credits" + i);
				var isEnabled = bp.cookies.get("isEnabled" + i);
				
				// sanitize the credit count and account enable/disable status
				creditCount = (creditCount && creditCount >= 0) ? creditCount : "N/A";
				isEnabled = (!isEnabled || isEnabled === "true");
				
				if (isEnabled && (i < MAX_ACCOUNTS_WITHOUT_LICENSE || (i >= MAX_ACCOUNTS_WITHOUT_LICENSE && bp.licensing.getLicenseStatus()))) { // account is enabled and can be added to the runnable list
					// add the account to the runnable list
					var account = new bp.Account(username, password);
					account.setCreditCount(creditCount);
					_runnableAccounts.push(account);
				}

				// populate the rows
				var row = accountsTable.insertRow(-1);
				var checkmarkCell = row.insertCell(0);
				var dsStatusCell = row.insertCell(1);
				var msStatusCell = row.insertCell(2);
				var dtStatusCell = row.insertCell(3);
				var usernameCell = row.insertCell(4);
				var creditsCell = row.insertCell(5);
				var optionsCell = row.insertCell(6);

				checkmarkCell.innerHTML = "<center><input type=checkbox id=\"check" + i + "\" " + (isEnabled ? "checked" : "") + " " + (disableChanges ? "disabled" : "") + " onclick=\"onAccountCheckmarksChange();\"></center>";
				dsStatusCell.innerHTML = "<center><span id=\"status" + i + "\">" + BLANK_STATUS + "</span></center>";
				msStatusCell.innerHTML = "<center><span id=\"status_ms" + i + "\">" + BLANK_STATUS + "</span></center>";
				dtStatusCell.innerHTML = "<center><span id=\"status_dt" + i + "\">" + BLANK_STATUS + "</span></center>";
				usernameCell.innerHTML = "<span id=\"accountName" + i + "\">" + username + "</span>&nbsp;&nbsp;&nbsp;";
				creditsCell.innerHTML = "<center><span id=\"credits" + i + "\">" + creditCount + "</span></center>";
				optionsCell.innerHTML = "<a href=\"#\" onclick=\"bp.accountManager.launchDashboardForAccountAtIndex(" + i + ");return false;\">Dashboard</a>&nbsp;&nbsp;&nbsp;"
				optionsCell.innerHTML += "<a href=\"#\" onclick=\"bp.accountManager.launchEmailForAccountAtIndex(" + i + ");return false;\">Outlook</a>&nbsp;&nbsp;&nbsp;";
				optionsCell.innerHTML += "<a href=\"#\" onclick=\"bp.accountManager.removeAccountAtIndex(" + i + ");return false;\">Remove</a>";
				
				// check for a license beyond the 5th account
				if (i >= MAX_ACCOUNTS_WITHOUT_LICENSE && !bp.licensing.getLicenseStatus()) { // > 5 accounts without a license
					// mark the account as disabled
					bp.cookies.set("isEnabled" + i, false);
					
					// dash out the 6th account and beyond when there is no license
					document.getElementById('status' + i).innerHTML = DASHED_INDICATOR;
					document.getElementById('status_ds' + i).innerHTML = DASHED_INDICATOR;
					document.getElementById('status_ms' + i).innerHTML = DASHED_INDICATOR;
					document.getElementById('status_dt' + i).innerHTML = DASHED_INDICATOR;
					document.getElementById('accountName' + i).innerHTML = "<strike>" + username + "</strike>";
					document.getElementById('credits' + i).innerHTML = "<strike>" + credits + "</strike>";
				}

			}
		}
	}

	accountManager.addAccount = function (account) { 
		// add account to list
		_accounts.push(account);
		
		// update the cookies to reflect the new account
		var newAccountCount = _accounts.length;
		bp.cookies.set("username" + newAccountCount, account.getUsername());
		bp.cookies.set("password" + newAccountCount, account.getPassword());
		bp.cookies.set("accountCount", newAccountCount);
		
		// update the account manager display
		accountManager.updateDisplay(false);
	}
	
	accountManager.removeAccount = function (account) {
		var accountIndex = _getAccountIndex(account);
		var oldAccountCount = _accounts.length;
		
		// remove account from list
		_accounts.splice(accountIndex, 1);
		
		// delete the corresponding cookies
		bp.cookies.remove("username" + accountIndex);
		bp.cookies.remove("password" + accountIndex);
		bp.cookies.remove("credits" + accountIndex);
		bp.cookies.remove("isRedeemable" + accountIndex);

		// remove the account from the list
		_accounts.splice(accountIndex, 1);

		// update the new account count
		bp.cookies.set("accountCount", _accounts.length);

		// re-initialize the cookies with the new account data
		for (var i = 0, l = _accounts.length; i < l; i++) {
			bp.cookies.set("username" + (i + 1), _account[i].getUsername());
			bp.cookies.set("password" + (i + 1), _account[i].getPassword());
			bp.cookies.set("credits" + (i + 1), _account[i].getCreditCount());
		}

		// delete the cookie corresponding to the old account
		bp.cookies.remove("username" + oldAccountCount);
		bp.cookies.remove("password" + oldAccountCount);
		bp.cookies.remove("credits" + oldAccountCount);
		bp.cookies.remove("isRedeemable" + oldAccountCount);

		// update the account manager display
		accountManager.updateDisplay(false);
	}
	
	accountManager.removeAccountAtIndex = function (index) { 
		accountManger.removeAccount(_getAccountAtIndex(index));
	}
	
	accountManager.launchDashboardForAccountAtIndex = function (index) { 
		accountManager.getAccountAtIndex(index).launchDashboard();
	}
	
	accountManager.launchEmailForAccountAtIndex = function (index) { 
		accountManager.getAccountAtIndex(index).launchEmail();
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

		document.getElementById('status' + currentAccountIndex).innerHTML = WARNING_INDICATOR;
		document.getElementById('status_ms' + currentAccountIndex).innerHTML = WARNING_INDICATOR;
		document.getElementById('status_dt' + currentAccountIndex).innerHTML = WARNING_INDICATOR;
		document.getElementById('status' + index).innerHTML = WARNING_INDICATOR;
		document.getElementById('credits' + index).style.color = BLOCKED_COLOR;
		document.getElementById('accountName' + index).style.color = BLOCKED_COLOR;
		document.getElementById('credits' + index).innerHTML = "BLOCKED";
	}
	
	accountManager.markAccountAsBanned = function (account) {
		var index = _getAccountIndex(account);
		
		document.getElementById('status' + currentAccountIndex).innerHTML = WARNING_INDICATOR;
		document.getElementById('status_ms' + currentAccountIndex).innerHTML = WARNING_INDICATOR;
		document.getElementById('status_dt' + currentAccountIndex).innerHTML = WARNING_INDICATOR;
		document.getElementById('status' + index).innerHTML = WARNING_INDICATOR;
		document.getElementById('credits' + index).style.color = BANNED_COLOR;
		document.getElementById('accountName' + index).style.color = BANNED_COLOR;
		document.getElementById('credits' + index).innerHTML = "BANNED!!!";		
	}

	accountManager.markAccountAsProblematic = function (account) {
		var index = _getAccountIndex(account);
		
		document.getElementById('status' + currentAccountIndex).innerHTML = WARNING_INDICATOR;
		document.getElementById('status_ms' + currentAccountIndex).innerHTML = WARNING_INDICATOR;
		document.getElementById('status_dt' + currentAccountIndex).innerHTML = WARNING_INDICATOR;
		document.getElementById('status' + index).innerHTML = WARNING_INDICATOR;
		document.getElementById('credits' + index).style.color = BANNED_COLOR;
		document.getElementById('accountName' + index).style.color = BANNED_COLOR;
		document.getElementById('credits' + index).innerHTML = "???";		
	}
	
	accountManager.onAccountCheckmarkChange = function (index) { 
		// update the account's enabled status
		bp.cookies.set("isEnabled" + index, document.getElementById('check' + index).checked);
		
		// check to see if all accounts are checked, and check the global checkmark if so
		_globalAccountCheckmarkChecked = true; // assume all accounts are checked
		
		for (var i = 0, l = _accounts.length; i < l; i++) { 
			if (!bp.cookies.get("isEnabled" + i) || bp.cookies.get("isEnabled" + i) === "false") { // unchecked account
				_globalAccountCheckmarkChecked = false;
			}
		}
		
		// update the global checkmark
		bp.cookies.set("globalCheck", _globalAccountCheckmarkChecked);
		document.getElementById('globalCheck').checked = _globalAccountCheckmarkChecked;
		
		// update the account manager display
		accountManager.updateDisplay(false);
	}
	
	accountManager.onGlobalCheckmarkChange = function () { 
		// update the global checkmark status
		_globalAccountCheckmarkChecked = document.getElementById('globalCheckmark').checked;
		
		if (_globalAccountCheckmarkChecked) { 
			if (bp.licensing.getLicenseStatus()) { // licensed
				// enable every account in the list
				for (var i = 0, l = _accounts.length; i < l; i++) { 
					bp.cookies.set("check" + i, true);
				}
			} else { // unlicensed
				// enable up to the first five accounts
				for (var i = 0, l = Math.min(_accounts.length, MAX_ACCOUNTS_WITHOUT_LICENSE); i < l; i++) { 
					bp.cookies.set("check" + i, true);
				}
			}
		}
	}
	
	return accountManager;
})();
		
		