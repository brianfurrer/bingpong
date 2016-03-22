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
	
	return rewardsDashboard;
})();