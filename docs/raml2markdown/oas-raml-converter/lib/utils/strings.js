'use strict';

var _ = require('lodash');

module.exports = {
	computeOperationId: function computeOperationId(method, path) {
		method = _.trim(method).toUpperCase();
		path = _.trim(path);

		if (path === '/' || path === '') {
			return method + '_root';
		}

		return method + '_' + _.trim(path, '/').replace(/[{}]/g, '').replace(/[\/.]/g, '-');
	},

	computeTraitName: function computeTraitName(name, key) {
		var traitName = 'trait:' + _.camelCase(name);

		if (key) {
			traitName += ':' + key;
		}

		return traitName;
	},

	computeTraitNameOas30: function computeTraitNameOas30(name, key) {
		var traitName = 'trait_' + _.camelCase(name);

		if (key) {
			traitName += '_' + key;
		}

		return traitName;
	},

	computeResourceDisplayName: function computeResourceDisplayName(path) {
		return path.substring(path.lastIndexOf('/') + 1);
	},

	checkAndReplaceInvalidChars: function checkAndReplaceInvalidChars(object, validChars, replacement) {
		for (var index in object) {
			if (!object.hasOwnProperty(index)) continue;
			if (!validChars.includes(object[index])) object = _.replace(object, object[index], replacement);
		}
		return object;
	},

	sanitise: function sanitise(s) {
		var components = s.split('/');
		components[0] = components[0].replace(/[^A-Za-z0-9_\-.]+|\s+/gm, '_');
		return components.join('/');
	},

	getIndent: function getIndent(line) {
		var trimStart = _.trimStart(line);
		return line.length - trimStart.length;
	}
};