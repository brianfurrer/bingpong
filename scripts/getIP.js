var MAX_FAILED_ATTEMPTS = 5;
var IP, isUS, failedAttempts = 0;

function GetIP() { 
	$.ajax({
		url: 'ip.php', // old url: http://ip-api.com/json/?fields=8193
		type: 'GET',
		dataType: 'json',
		cache: false,
      		success: function (response) { 
      			document.getElementById('loader').innerHTML = "<img src=\"http://bing-pong.com/blue10.png\" width=\"11\" height=\"11\"></img>";
    	
        		ip = response.query;
        		isUS = ((response.country == "United States") ? 1 : 0);
        
        		if (isUS) { 
				$("#flag").attr("src", "us.png");
            			document.getElementById('countrywarning').innerHTML = "&nbsp;";
            			document.getElementById('ip').innerHTML = response.query;
       			} else {
           			$("#flag").attr("src", "no-us.png");
            			blink();
            			document.getElementById('countrywarning').innerHTML = "<b><font color=\"red\">WARNING!!!</font></b><br>We have detected that your IP originates from " + response.country + " instead of the United States.<br>Your accounts <b>WILL</b> get banned if you search on this IP!<br><br>";
            			document.getElementById('ip').innerHTML = "<font color=\"red\">" + response.query + "</font>";
        		}
        
        		setTimeout(RefreshIP, 5000);
        	},
        	error: function (response) {
        		failedAttempts++;
        		if (failedAttempts < MAX_FAILED_ATTEMPTS) { 
        			GetIP();
        		} else {
        			$("#flag").attr("src", "blue10.png");
        			document.getElementById('ip').innerHTML = "<font color=\"red\">???</font>";
        			document.getElementById('countrywarning').innerHTML = "There was an issue contacting <a href=\"http://ip-api.com\">ip-api</a> for your IP info.<br>Perhaps they are overloaded?<br><br>";
        		}
        	}
        });
}

function RefreshIP() { 
	document.getElementById('loader').innerHTML = "<i class=\"fa fa-refresh fa-spin\"></i>";
	GetIP();
}

function BlinkEnded() { 
    if (!isUS) { 
    	blink();
    }
}

function blink() {
    $('.flagclass').delay(100).fadeTo(100, 0.2).delay(100).fadeTo(100, 1, BlinkEnded);
}

$.getJSON("http://ip-api.com/json/?callback=?", function(response) {
    document.getElementById('ip').innerHTML = response.query;
});

RefreshIP();