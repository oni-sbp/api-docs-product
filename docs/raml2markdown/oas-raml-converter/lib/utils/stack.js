"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Stack = function () {
	function Stack() {
		_classCallCheck(this, Stack);

		this.count = 0;
		this.storage = {};
	}

	_createClass(Stack, [{
		key: "push",
		value: function push(value) {
			this.storage[this.count] = value;
			this.count++;
		}
	}, {
		key: "pop",
		value: function pop() {
			// Check to see if the stack is empty
			if (this.count === 0) {
				return undefined;
			}

			this.count--;
			var result = this.storage[this.count];
			delete this.storage[this.count];
			return result;
		}
	}, {
		key: "size",
		value: function size() {
			return this.count;
		}
	}, {
		key: "isEmpty",
		value: function isEmpty() {
			return this.size() === 0;
		}
	}], [{
		key: "create",
		value: function create(data, sep) {
			var dataArray = data.split(sep).reverse();
			var result = new Stack();
			dataArray.forEach(function (elem) {
				return result.push(elem);
			});

			return result;
		}
	}]);

	return Stack;
}();

module.exports = Stack;