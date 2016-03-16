bp.licensing = (function () {
	var _isLicensed = false;
	
	var licensing;
	
	// simply return the last obtained license status
	licensing.getLicenseStatus = function () { 
		return _isLicensed;
	}
	
	// update and return the current license status
	licensing.updateLicenseStatus = function (callback) {
		bp.helperTools.checkForLicense(function (isLicensed) { 
			_isLicensed = isLicensed;
			callback(isLicensed);
		});
	}
	
	return licensing;
})();