'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _ = require('lodash');
var jsonSchemaConverter = require('json-schema-compatibility');

module.exports = {
	parse: function parse(data) {
		if (typeof data !== 'string') {
			return data;
		}

		try {
			var result = JSON.parse(data);
			if (typeof result === 'string') {
				return this.parse(result);
			}
			return result;
		} catch (err) {
			//can't parse, use as it is
			return data;
		}
	},
	stringify: function stringify(jsonObj, spacing) {
		if (typeof jsonObj === 'string') {
			return jsonObj;
		}
		if (!spacing) {
			spacing = 0;
		}
		return JSON.stringify(jsonObj, null, spacing);
	},
	//format given object/json string with pretty print style
	format: function format(data) {
		if (typeof data !== 'string') {
			if ((typeof data === 'undefined' ? 'undefined' : _typeof(data)) === 'object') {
				return this.stringify(data, 4);
			}
			return data;
		}
		//try parse
		var result = this.parse(data);
		if (typeof result === 'string') {
			//not parsable, no formatting possible
			return data;
		}
		return this.stringify(result, 4);
	},
	//return json version of the given object, excluding function/getters/setters etc
	toJSON: function toJSON(obj) {
		var def = {};
		for (var property in obj) {
			if (!obj.hasOwnProperty(property)) continue;

			var propType = _typeof(obj[property]);
			if (propType !== 'function' && propType !== 'undefined') {
				def[property] = obj[property];
			}
		}
		return def;
	},
	//sort object keys in given order, acccepts both array and objects
	orderByKeys: function orderByKeys(obj, propertiesOrder) {
		//if array recursive call to all items
		if (Array.isArray(obj)) {
			var me = this;
			return obj.map(function (item) {
				return me.orderByKeys(item, propertiesOrder);
			});
		}

		var orderedObj = {};
		//place the ordered key items first
		for (var i in propertiesOrder) {
			if (!propertiesOrder.hasOwnProperty(i)) continue;

			var key = propertiesOrder[i];
			if (obj.hasOwnProperty(key)) {
				orderedObj[key] = obj[key];
			}
		}

		//add if something missing from the given orders
		for (var _key in obj) {
			if (!obj.hasOwnProperty(_key)) continue;
			if (!orderedObj.hasOwnProperty(_key)) {
				orderedObj[_key] = obj[_key];
			}
		}
		return orderedObj;
	},
	// checks whether json schema is empty
	isEmptySchema: function isEmptySchema(schema) {
		if (_.isEmpty(schema)) {
			return true;
		}

		var parsed = schema;
		if (typeof parsed === 'string') {
			try {
				parsed = JSON.parse(parsed);
			} catch (e) {
				return true;
			}
		}

		if (!parsed || !Object.keys(parsed).length || parsed.properties && !Object.keys(parsed.properties).length) {
			return true;
		}

		return parsed.type === 'array' && _.isEmpty(parsed.items);
	},
	cleanSchema: function cleanSchema(schema) {
		var parsed = this.parse(schema);

		try {
			jsonSchemaConverter.v4(parsed);
		} catch (e) {
			// ignore
		}

		return this.stringify(parsed, 4);
	},
	isJson: function isJson(str) {
		try {
			if (!_.startsWith(str, '{') || !_.endsWith(str, '}')) return false;

			JSON.parse(str);
		} catch (e) {
			return false;
		}
		return true;
	}
};