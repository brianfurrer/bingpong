bp.licensing = (function () {
	var NOT_CHECKED = -1;
	
	var _isLicensed = NOT_CHECKED
	
	var licensing;
	
	// simply return the last obtained license status
	licensing.getLicenseStatus = function () {
		if (_isLicensed !== NOT_CHECKED) { 
			return _isLicensed;
		} else {
			throw "Exception (bp.licensing): bp.licensing.updateLicenseStatus() must be called at least once before calling bp.licensing.getLicenseStatus()!";
		}
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