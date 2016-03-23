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
	
	// NOTE: this uses cached dashboard data
	rewardsDashboard.getTasks = function () { 
		var tasks = _dashboardData.split("rewardsapp/redirect?url=");
		
		// remove the first element of the above array since it doesn't contain any task info
		tasks.splice(0, 1);
		
		// update the task URLs
		for (var i = 0, l = tasks.length; i < l; i++) {
			var tempTask = tasks[i];
			tasks[i] = "https://www.bing.com/rewardsapp/redirect?url=" + tempTask.substring(0, tempTask.indexOf("\" id=\"")).replace(/&amp;/g, "&");
		}
		
		// fix the last dashboard task URL
		tempTask = tasks[tasks.length - 1];
		tasks[tasks.length - 1] = tempTask.substring(0, tempTask.indexOf("\" class=\"next\""));
		
		// remove any completed tasks from the list of tasks to do
 -		for (var i = 0, l = tasks.length; i < l; i++) {
 -			if (dashboardTaskURLs[i].indexOf("state=Completed") !== -1) {
 -				dashboardTaskURLs.splice(i, 1);
 -			}
 -		}
 
		return tasks;
	}
	
	rewardsDashboard.getNumberOfMissingDesktopSearchCredits = function () {
		// ignore the dashboard data before the "Every day ways to earn" section
		var data = _dashboardData.split("Every day ways to earn")[1];
		
		if (data.indexOf("<div class=\"progress\">15 credits") === -1) { // desktop searches are incomplete
			return 15 - parseInt(data.match(/(?:<div class="progress">)(\d+)(?: of 15 credits<\/div>)/)[1]);
		} else { // desktop searches are complete
			return 0;
		}
	}
	
	rewardsDashboard.getNumberOfMissingMobileSearchCredits = function () { 
		// ignore the dashboard data before the "Every day ways to earn" section
		var data = _dashboardData.split("Every day ways to earn")[1];
		
		if (data.indexOf("<div class=\"progress\">10 credits") === -1) { // mobile searches are incomplete
			return 10 - parseInt(data.match(/(?:<div class="progress">)(\d+)(?: of 10 credits<\/div>)/)[1]);
		} else { // mobile searches are complete
			return 0;
		}
	}
	
	rewardsDashboard.getNumberOfMissingMonthlyBonusSearches = function () { 
		// ignore the dashboard data before the "Every day ways to earn" section
		var data = _dashboardData.split("Every day ways to earn")[1];

		// calculate the number of monthly searches needed to obtain the bonus
		var monthlyBonusSearchesToGet = parseInt(data.match(/(?:Search )(\d+)(?: times this month)/)[1]);
		
		// calculate the number of monthly searches that have already been done
		var re = new RegExp("(?:<div class=\"progress\">)(\\d+)(?: of " + monthlyBonusSearchesToGet + " searches<\\/div>)", "i");
		var monthlyBonusSearchesCompleted = parseInt(data.match(re)[1]);
		
		// return the difference
		return monthlyBonusSearchesToGet - monthlyBonusSearchesCompleted;
	}
	
	return rewardsDashboard;
})();