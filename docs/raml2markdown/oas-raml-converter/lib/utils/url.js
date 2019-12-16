'use strict';

var request = require('request');
var _ = require('lodash');

module.exports = {
	parseURL: function parseURL(url) {
		var indexProtocol = url.indexOf('://');
		var protocol = indexProtocol !== -1 ? url.substr(0, indexProtocol) : '';
		var protocolLength = indexProtocol !== -1 ? protocol.length + 3 : 0;
		var indexPath = url.indexOf('/', protocolLength);
		var hostnameLength = indexPath !== -1 ? indexPath - protocolLength : url.length - protocolLength;
		var host = url.substr(protocolLength, hostnameLength);
		var path = indexPath !== -1 ? url.substr(indexPath) : '';

		var result = {};
		if (!_.isEmpty(protocol) && protocol.startsWith('http') || protocol.startsWith('ws')) result.protocol = protocol;

		if (!_.isEmpty(host)) result.host = host;

		if (!_.isEmpty(path)) {
			var queryIndex = path.indexOf('?');
			var pathWOQuery = queryIndex !== -1 ? path.substr(0, queryIndex) : path;
			var musicIndex = pathWOQuery.indexOf('#');
			var basePath = musicIndex !== -1 ? pathWOQuery.substr(0, musicIndex) : pathWOQuery;
			if (!_.isEmpty(basePath) && basePath !== '/') result.pathname = basePath;
		}

		return result;
	},
	isURL: function isURL(path) {
		if (!path) {
			throw new Error('Invalid path/url string given.');
		}
		var expression = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%_+.~#?&\/=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_+.~#?&\/=]*)?/gi;
		var regexp = new RegExp(expression);
		return path.match(regexp);
	},

	get: function get(url) {
		return new Promise(function (resolve, reject) {
			request(url, function (error, response, body) {
				if (!error && response.statusCode === 200) {
					resolve(body);
				} else {
					reject(error || new Error('Could not fetch remote URL.'));
				}
			});
		});
	},

	join: function join(a, b) {
		return _.trimEnd(a, '/') + '/' + _.trimStart(b, '/');
	},

	isTemplateUri: function isTemplateUri(uri) {
		var decodeUri = decodeURI(uri);
		return decodeUri.indexOf('{') !== -1 && decodeUri.indexOf('}') !== -1;
	}
};