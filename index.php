<html>
	<head>
		<title>Bing Pong - Bing Rewards Bot</title>
		
		<meta name="description" content="The best Bing Rewards bot out there, period.">
		<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
		<meta name="keywords" content="bing rewards bot, amazon gift cards, microsoft">
		<meta name="referrer" content="never">	
		<meta name="wot-verification" content="f7274dfc8176c1a76b17"> 
		<meta name="msvalidate.01" content="FAF432EE080F0D1FD9585E5645A81FC8">
		
		<link rel="shortcut icon" type="image/x-icon" href="../favicon.ico">
		<link rel="apple-touch-icon" href="touch-icon-iphone2.png">
		<link rel="apple-touch-icon" sizes="76x76" href="touch-icon-ipad2.png">
		<link rel="apple-touch-icon" sizes="120x120" href="touch-icon-iphone-retina2.png">
		<link rel="apple-touch-icon" sizes="152x152" href="touch-icon-ipad-retina2.png">
		<link rel="chrome-webstore-item" href="https://chrome.google.com/webstore/detail/cohnfldcnegepfhhfbcgecblgjdcmcka">
		
		<link href="//maxcdn.bootstrapcdn.com/font-awesome/4.4.0/css/font-awesome.min.css" rel="stylesheet">
		
		<style type="text/css">
			body						{ font-family: Verdana, Arial; font-size: 12px; margin: 0px; padding: 0px; text-align: center; color: #FAFAFA; background-color: #2B3E50;  }
			input         				{ font-family: Verdana,Arial; font-size: 9pt; color: #000000; }
			textarea      				{ font-family: Verdana,Arial; font-size: 9pt; color: #000000; }
			select        				{ font-family: Verdana,Arial; font-size: 7pt; color: #000000; }
			A:link						{ text-decoration: none; color: #FF9933; }
			A:visited					{ text-decoration: none; color: #FF9933; }
			A:hover						{ text-decoration: underline overline; color: #FF9933; }
			td, th						{ font-size:12px; }
			td							{ min-width: 25px; }
			table:not(.optionsTable)	{ border: 1px solid white; border-collapse: collapse; }
			td:not(.optionsTable)		{ border: 1px solid white; border-collapse: collapse; }
			th:not(.optionsTable)		{ border: 1px solid white; border-collapse: collapse; }
			.centered					{ position: fixed; top: 50%; left: 50%; margin-top: -182px; margin-left: -76px; }
	 	</style>
	</head>
	
	<body>
		<script src="scripts/jquery.js" type="text/javascript"></script>
		
		<div id="fb-root"></div>
		
		<!-- title -->
		<b>Bing Pong</b>
		&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href="../changelog.php">About</a>
		&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href="http://bing-pong.com/contact.php">Contact developer</a></span>
		<div id="stuff"></div>
		<script>document.getElementById('stuff').innerHTML = "<HR width=\"" + 0.95*$(window).width() + "\">";</script>
		
		<!-- Bing Pong header -->
		<span id="ad">
			<?php include_once("scripts/adcode.php"); ?>
			<br>
		</span>
		<!-- hide the ad if the user is licensed -->
		<script>
			if (window.localStorage.getItem("removeAd") == "true") { 
				document.getElementById('ad').style.display = "none";
			}
		</script>
		<br>
<!--	<b>Other versions of Bing Pong:</b>
		<br>
		<a href="http://nightly.bing-pong.com/" target="_blank">Bing Pong 21 nightlies</a><br>
		<a href="http://bing-pong.com/legacy" target="_blank">Bing Pong (legacy)</a>
		<br><br>
-->
		<a href="http://reddit.com/r/bingpong" target="_blank">Official Bing Pong subreddit: /r/bingpong</a><br>
		<a href="http://bing-pong.com/mobile_searches_instructions.php" target="_blank">Instructions on setting up multiple accounts and mobile searches</a>
		<br>
		<br><b>UPDATE (11/7/15):</b>
		<br>Bing Pong 21 is live! You can find more information about this huge update <a href="https://www.reddit.com/r/bingpong/comments/3rtgbb/bing_pong_21_is_moving_to_the_main_website/" target="_blank">here</a>.
		<br>As a result, the bot is now much safer to use and --disable-web-security is no longer required!
		<br>Also, "Emulate human searching behavior" is enabled by default, so you will experience slower searching.
		<br>To get pre-Bing Pong 21 searching speeds, you may disable this option, but using it is strongly recommended.
		<br>
		<br><b>Current IP: <span id="loader"><img src="http://bing-pong.com/blue10.png" width="16" height="11"></img></span> <img class="flagclass" id="flag" src="us.png"></img> <span id="ip">Loading...</span></b>
		<br>
		<br><span id="countrywarning"></span>

		<!-- Bing Pong UI -->
		<input type=button value="Run Bing Pong (35 searches)" onclick="runBingPong();" id="runBingPongButton" disabled>
		<form name="search">
			<center>
				<table class="optionsTable" cellspacing="0" cellpadding="0">
					<tr>
						<td class="optionsTable" style="padding: 0.3em;">
							<b>Number of searches:</b>
						</td>
						<td class="optionsTable" style="padding: 0.3em;">
							<i class="fa fa-laptop fa-lg"></i> <input type="text" id="numberOfDesktopSearches" size=2 value="35" style="height:17px;text-align:right" onfocus="if(this.value != '') {this.value=''}" onblur="if(this.value == ''){this.value ='35'}" onKeyUp="onSettingsChange();" disabled>
						</td>
						<td class="optionsTable" style="padding: 0.3em;">
							<i class="fa fa-mobile fa-lg"></i>&nbsp;&nbsp;<input type="text" id="numberOfMobileSearches" size=2 value="20" style="height:17px;text-align:right" onfocus="if(this.value != '') {this.value=''}" onblur="if(this.value == ''){this.value ='20'}" onKeyUp="onSettingsChange();" disabled>
						</td>
					</tr>
				</table>
				
				<!-- options!!! -->
				<table class="optionsTable" cellspacing="0" cellpadding="0">
					<!-- "Pause ... - ... seconds between searches" option -->
					<tr>
						<td class="optionsTable">
							<input type=checkbox id="useSearchDelayOption" onclick="onSettingsChange();" disabled>
						</td>
						<td class="optionsTable">
							Pause <input type="text" id="minSearchDelayTime" size=1 value="5" style="height:17px;text-align:right" onfocus="if(this.value != '') {this.value=''}" onblur="if(this.value == ''){this.value ='5'}" onKeyUp="onSettingsChange();" disabled>-<input type="text" id="maxSearchDelayTime" size=1 value="15" style="height:17px;text-align:right" onfocus="if(this.value != '') {this.value=''}" onblur="if(this.value == ''){this.value ='15'}" onKeyUp="onSettingsChange();" disabled> seconds between searches
						</td>
					</tr>
					<!-- "Use multiple Bing Rewards accounts" option -->
					<tr>
						<td class="optionsTable">
							<input type=checkbox id="multipleAccountsOption" onclick="onSettingsChange();" disabled>
						</td>
						<td class="optionsTable">
							<span id="multipleAccountsText">Use multiple Bing Rewards accounts</span>
						</td>
					</tr>
					<!-- "Run the accounts in random order" option -->
					<tr>
						<td class="optionsTable">
							<input type=checkbox id="runInRandomOrderOption" onclick="onSettingsChange();" disabled>
						</td>
						<td class="optionsTable">
							<span id="runInRandomOrderText">Run the accounts in random order</span>
						</td>
					</tr>
					<!-- "Perform the Bing Rewards dashboard tasks" option -->
					<tr>
						<td class="optionsTable">
							<input type=checkbox id="dashboardTasksOption" onclick="onSettingsChange();" disabled>
						</td>
						<td class="optionsTable">
							<span id="dashboardTasksText">Perform the Bing Rewards dashboard tasks</span>
						</td>
					</tr>
					<!-- "Solve the Bing Rewards dashboard trivia questions" option
					<tr>
						<td class="optionsTable">
							<input type=checkbox id="triviaOption" onclick="onSettingsChange();" disabled>
						</td>
						<td class="optionsTable">
							<span id="triviaText">Solve the dashboard trivia questions</span>
						</td>
					</tr>-->

					<!-- "Pause when a CAPTCHA is encountered" option -->
					<tr>
						<td class="optionsTable">
							<input type=checkbox id="pauseOnCaptchaOption" onclick="onSettingsChange();" disabled>
						</td>
						<td class="optionsTable">
							<span id="pauseOnCaptchaText">Pause when a CAPTCHA is encountered</span>
						</td>
					</tr>
					<!-- "Wait for an IP change every ... accounts" option -->
					<tr>
						<td class="optionsTable">
							<input type=checkbox id="waitForIPChangeOption" onclick="onSettingsChange();" disabled>
						</td>
						<td class="optionsTable">
							Wait for an IP change every 
							<select id="accountsPerIP" onChange="onSettingsChange();" disabled>
								<option value="1">1</option>
								<option value="2">2</option>
								<option value="3">3</option>
								<option value="4">4</option>
								<option value="5" selected="selected">5</option>
							</select> account(s)
						</td>
					</tr>
					<!-- "Automatically run Bing Pong on each visit" option -->
					<tr>
						<td class="optionsTable">
							<input type=checkbox id="runOnPageLoadOption" onclick="onSettingsChange();" disabled>
						</td>
						<td class="optionsTable">
							Automatically run Bing Pong on each visit
						</td>
					</tr>
					<!-- "Automatically run Bing Pong daily at..." option -->
					<tr>
						<td class="optionsTable">
							<input type=checkbox id="autoRunOption" onclick="onSettingsChange(); autoRunOptionChecked();" disabled>
						</td>
						<td class="optionsTable">
							Automatically run Bing Pong daily at 
							<select id="autoRunTime" onChange="onSettingsChange();" disabled>
								<option value="1">12 AM</option>
								<option value="2">1 AM</option>
								<option value="3" selected>2 AM</option>
								<option value="4">3 AM</option>
								<option value="5">4 AM</option>
								<option value="6">5 AM</option>
								<option value="7">6 AM</option>
								<option value="8">7 AM</option>
								<option value="9">8 AM</option>
								<option value="10">9 AM</option>
								<option value="11">10 AM</option>
								<option value="12">11 AM</option>
								<option value="13">12 PM</option>
								<option value="14">1 PM</option>
								<option value="15">2 PM</option>
								<option value="16">3 PM</option>
								<option value="17">4 PM</option>
								<option value="18">5 PM</option>
								<option value="19">6 PM</option>
								<option value="20">7 PM</option>
								<option value="21">8 PM</option>
								<option value="22">9 PM</option>
								<option value="23">10 PM</option>
								<option value="24">11 PM</option>
							</select>
						</td>
					</tr>
				</table>
				<input type=button value="Bing Pong Helper options" onclick="openBPHOptions();" id="bphOptionsButton" disabled>
				<br>
			</center>
		</form>
		
		<!-- Bing Pong status -->
		<b><div id="status"><img src="loader.gif" width="16" height="16"></img> Loading Bing Pong...</div>
		<div id="remaining">&nbsp;</div><div id="extra">&nbsp;</div></b>
		
		<!-- <br><br> -->

		<!-- Bing Pong account manager -->
		<center>
			<div id="accountManager"><br></div>
		</center>
		
		<!-- FB like button -->
		<div class="fb-like" data-href="http://bing-pong.com" data-layout="button_count" data-action="like" data-show-faces="false" data-share="false"></div><br>
		
		<!-- donation -->
		<b>Like this bot? Please donate!</b>
		<br><a href="https://blockchain.info/address/16TjqieyZVdm3Qf8Upomj4ZeD3tmsKtKdB" target="_blank">Donate Bitcoin</a> or <a href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=3W97UEG3JMEPJ" target="_blank">Donate via Paypal</a>
		
		
		<div class="iframes" style="visibility:hidden">
			<!-- iframes to do searches, etc. -->
			<iframe height="0" width="0" frameBorder="0" src="" id="searchFrame" style="display:none" sandbox="allow-forms allow-scripts" allowtransparency="true"></iframe>
		</div>
		
		<?php include_once("scripts/analytics.php"); ?>
		<script>
			(function(d, s, id) {
  				var js, fjs = d.getElementsByTagName(s)[0];
  				if (d.getElementById(id)) return;
  				js = d.createElement(s); js.id = id;
  				js.src = "//connect.facebook.net/en_US/all.js#xfbml=1";
  				fjs.parentNode.insertBefore(js, fjs);
			}(document, 'script', 'facebook-jssdk'));
		</script>
		
		<script src="scripts/getIP.js"></script>
		<script src="scripts/bp21_alpha181.js?cachebuster=<?php echo uniqid(); ?>"></script>
	</body>
</html>