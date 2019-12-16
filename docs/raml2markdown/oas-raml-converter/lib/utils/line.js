"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Line = function () {
	function Line(lineNumber, indent, data) {
		_classCallCheck(this, Line);

		this.lineNumber = lineNumber;
		this.indent = indent;
		this.data = data;
	}

	_createClass(Line, [{
		key: "getLineNumber",
		value: function getLineNumber() {
			return this.lineNumber;
		}
	}, {
		key: "getIndent",
		value: function getIndent() {
			return this.indent;
		}
	}, {
		key: "getData",
		value: function getData() {
			return this.data;
		}
	}], [{
		key: "create",
		value: function create(lineNumber, indent, data) {
			return new Line(lineNumber, indent, data);
		}
	}]);

	return Line;
}();

module.exports = Line;