'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var os = require('os');
var stringsHelper = require('./strings');
var Line = require('./line');

var Document = function () {
	function Document(data) {
		_classCallCheck(this, Document);

		this.data = data;
	}

	_createClass(Document, [{
		key: 'getLine',
		value: function getLine(lineNumber) {
			return this.data[lineNumber - 1];
		}
	}, {
		key: 'getLinesFrom',
		value: function getLinesFrom(lineNumber) {
			return this.data.slice(lineNumber === 0 ? 0 : lineNumber - 1);
		}
	}], [{
		key: 'create',
		value: function create(content) {
			var lines = content.split(os.EOL);
			var lineNumber = 0;
			var result = [];

			lines.forEach(function (line) {
				lineNumber = lineNumber + 1;
				var indent = stringsHelper.getIndent(line);
				var data = line.trim();

				result.push(new Line(lineNumber, indent, data));
			});

			return new Document(result);
		}
	}]);

	return Document;
}();

module.exports = Document;