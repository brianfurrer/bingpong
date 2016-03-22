bp.rewardsDashboard = (function () { 
	var _dashboardData;
	
	var rewardsDashboard = {};
	
	rewardsDashboard.getDashboardData = function () { 
		return _dashboardData;
	}
	
	rewardsDashboard.updateDashboardData = function (callback) { 
		bp.helperTools.performGETRequest("https://www.bing.com/rewards/dashboard", false, function (contents) {
			_dashboardData = contents;
			callback(_dashboardData);
		});
	}
	
	// note: callbackOnSuccess will recieve three parameters
	// desktopCreditsToGet: the number of desktop PC search credits to get (including credits already obtained)
	// mobileCreditsToGet: the number of mobile search credits to get, or -1 if the account cannot obtain mobile searches
	// monthlyBonusSearchesToGet: the number of searches to get the monthly bonus, or -1 if the account does not get a monthly bonus
	// if hasMonthlyBonus is true, mobileCreditsToGet is -1.
	rewardsDashboard.parseDashboardData = function (callbackOnSuccess, callbackOnParsingError, callbackOnBanned) { 
		bp.rewardsDashboard.updateDashboardData(function (dashboardData) { // get fresh dashboard data
			var desktopCreditsToGet, mobileCreditsToGet, monthlyBonusSearchesToGet;
			var matchedStrings = [];
			
			if (dashboardData.indexOf("Uh oh, it appears your Bing Rewards account has been suspended.") !== -1) { // banned account 
				callbackOnBanned();
				return false;
			}
			
			// beyond this point, the account is assumed to be in good standing
			// get the number of desktop credits to get: variant 1
			if (matchedStrings = dashboardData.match(/(?:Earn 1 credit per 2 searches on PC or mobile, up to )(\d+)( credits per day.)/)) { 
				desktopCreditsToGet = matchedStrings[1];
			}
			
			// variant 2
			if (matchedStrings = dashboardData.match(/(?:Earn 1 credit per 2 Bing searches up to )(\d+)( credits a day.)/)) { 
				desktopCreditsToGet = matchedStrings[1];
			}
			
			// check for the ability to do the monthly bonus
			if (matchedStrings = dashboardData.match(/(?:Search )(\d+)(?: times this month)/)) { 
				monthlyBonusSearchesToGet = matchedStrings[1];
				callbackOnSuccess(desktopCreditsToGet, -1, monthlyBonusSearchesToGet);
				return true;
			}
			
			// check for the ability to do mobile searches
			if (matchedStrings = dashboardData.match(/(?:<span class="title">Mobile search<\/span><span class="desc">Earn 1 credit per 2 Bing searches up to )(\d+)(?: credits a day.)/)) { 
				mobileCreditsToGet = matchedStrings[1];
				callbackOnSuccess(desktopCreditsToGet, mobileCreditsToGet, -1);
				return true;
			}
			
			// if we get to this point, there has been a parsing error
			callbackOnParsingError();
		});
	}
	
	return rewardsDashboard;
})();