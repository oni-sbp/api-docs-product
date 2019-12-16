'use strict';

exports.exit = function (error) {
	console.error(error);
	process.exit(1);
};

exports.stringify = function (data) {
	if (typeof data === 'string') return data;
	var result = JSON.stringify(data, null, 2);
	return result === '{}' ? '' : result;
};