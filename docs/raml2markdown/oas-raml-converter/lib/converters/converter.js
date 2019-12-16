'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _ = require('lodash');
var ConverterModel = require('oas-raml-converter-model');
var Root = ConverterModel.Root;

var Converter = function () {
	function Converter(model, annotationPrefix, def) {
		_classCallCheck(this, Converter);

		this.model = model;
		this.annotationPrefix = annotationPrefix;
		this.def = def;
	}

	_createClass(Converter, [{
		key: 'export',
		value: function _export(models) {
			var _this = this;

			var result = {};
			_.entries(models).map(function (_ref) {
				var _ref2 = _slicedToArray(_ref, 2),
				    key = _ref2[0],
				    value = _ref2[1];

				result[key] = _this._export(value);
			});

			return result;
		}
	}, {
		key: 'import',
		value: function _import(specDefs) {
			var _this2 = this;

			var result = {};
			if (_.isEmpty(specDefs)) return result;

			_.entries(specDefs).map(function (_ref3) {
				var _ref4 = _slicedToArray(_ref3, 2),
				    key = _ref4[0],
				    value = _ref4[1];

				result[key] = _this2._import(value);
			});

			return result;
		}
	}, {
		key: '_export',
		value: function _export() {
			throw new Error('export method not implemented');
		}
	}, {
		key: '_import',
		value: function _import() {
			throw new Error('import method not implemented');
		}
	}], [{
		key: '_options',
		value: function _options(options) {
			var validate = options && (options.validate === true || options.validateImport === true);
			var parseOptions = {
				attributeDefaults: false,
				rejectOnErrors: validate
			};
			return !options ? parseOptions : _.merge(parseOptions, options);
		}
	}, {
		key: 'copyObjectFrom',
		value: function copyObjectFrom(object, attrIdMap, attrIdSkip) {
			var result = {};

			_.entries(object).map(function (_ref5) {
				var _ref6 = _slicedToArray(_ref5, 2),
				    key = _ref6[0],
				    value = _ref6[1];

				if (attrIdSkip.indexOf(key) < 0 && !key.startsWith('x-')) {
					result[attrIdMap.hasOwnProperty(key) ? attrIdMap[key] : key] = value;
				}
			});

			return result;
		}
	}]);

	return Converter;
}();

module.exports = Converter;