'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _ = require('lodash');

module.exports = {

	getValidMethods: ['get', 'put', 'post', 'delete', 'options', 'head', 'patch'],

	getValidMimeTypes: ['application/json', 'application/xml', 'text/xml'],

	getValidFormDataMimeTypes: ['multipart/form-data', 'application/x-www-form-urlencoded'],

	removePropertiesFromObject: function removePropertiesFromObject(object, propNames) {
		for (var id in object) {
			if (!object.hasOwnProperty(id)) continue;

			var value = object[id];
			if (_.includes(propNames, id)) {
				delete object[id];
			}
			if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') {
				this.removePropertiesFromObject(value, propNames);
			}
		}
	},

	getResponseName: function getResponseName(method, code) {
		return method + ':' + code;
	},


	isJson: function isJson(str) {
		try {
			JSON.parse(str);
		} catch (e) {
			return false;
		}
		return true;
	}
};