'use strict';

var parseString = require('xml2js').parseString;

module.exports = {
	isXml: function isXml(data) {
		var result = false;
		parseString(data, function (err, r) {
			if (r) result = true;
		});
		return result;
	}
};