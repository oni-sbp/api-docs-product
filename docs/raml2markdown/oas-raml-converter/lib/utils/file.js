'use strict';

var _ = require('lodash');

module.exports = {
	isFilePath: function isFilePath(path) {
		if (_.isEmpty(path)) return false;

		var split = path.split('/');
		if (split.length === 0) return false;

		var result = false;
		split.forEach(function (entry) {
			if (entry.split('.').length === 2) result = true;
		});
		return result;
	}
};