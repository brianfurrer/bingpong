bp.cookies = (function () { 
	var cookies = {};
	
	cookies.set = function (cookieName, cookieValue) { 
		window.localStorage.setItem(cookieName, cookieValue);
	}
	
	cookies.get = function (cookieName) { 
		return window.localStorage.getItem(cookieName);
	}
	
	cookies.remove = function (cookieName) { 
		window.localStorage.removeItem(cookieName);
	}
	
	return cookies;
})();