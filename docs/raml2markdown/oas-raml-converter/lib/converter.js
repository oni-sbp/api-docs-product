'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Converters = require('./converters/index');

var Converter = function () {
	function Converter(fromFormat, toFormat) {
		var modelErrors = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

		_classCallCheck(this, Converter);

		this.modelErrors = modelErrors;
		this.importer = Converters.factory(fromFormat);
		if (!this.importer) {
			throw new Error('from format ' + fromFormat.name + ' not supported');
		}
		this.importer.type = fromFormat;

		this.exporter = Converters.factory(toFormat);
		if (!this.exporter) {
			throw new Error('to format ' + toFormat.name + ' not supported');
		}
		this.exporter.type = toFormat;
		this.format = this.exporter.type.formats[0];
	}

	_createClass(Converter, [{
		key: 'getModelFromData',
		value: function getModelFromData(data, options) {
			var _this = this;

			return new Promise(function (resolve, reject) {
				_this._loadData(data, options).then(function () {
					var model = _this.importer.import(_this.importer.data, _this.modelErrors);
					resolve(model);
				}).catch(reject);
			});
		}
	}, {
		key: 'getModelFromFile',
		value: function getModelFromFile(file, options) {
			var _this2 = this;

			return new Promise(function (resolve, reject) {
				_this2._loadFile(file, options).then(function () {
					var model = _this2.importer.import(_this2.importer.data, _this2.modelErrors);
					resolve(model);
				}).catch(reject);
			});
		}
	}, {
		key: 'convertFromModel',
		value: function convertFromModel(model, options) {
			var _this3 = this;

			return new Promise(function (resolve, reject) {
				try {
					_this3.exporter.export(model, _this3._getFormat(options)).then(resolve).catch(reject);
				} catch (e) {
					reject(e);
				}
			});
		}
	}, {
		key: 'convertFile',
		value: function convertFile(file, options) {
			var _this4 = this;

			return new Promise(function (resolve, reject) {
				_this4.getModelFromFile(file, options).then(function (model) {
					_this4.convertFromModel(model, options).then(resolve).catch(reject);
				}).catch(reject);
			});
		}
	}, {
		key: 'convertData',
		value: function convertData(data, options) {
			var _this5 = this;

			return new Promise(function (resolve, reject) {
				_this5.getModelFromData(data, options).then(function (model) {
					_this5.convertFromModel(model, options).then(resolve).catch(reject);
				}).catch(reject);
			});
		}
	}, {
		key: '_loadFile',
		value: function _loadFile(filePath, options) {
			return this.importer._loadFile(filePath, options);
		}
	}, {
		key: '_loadData',
		value: function _loadData(rawData, options) {
			return this.importer._loadData(rawData, options);
		}
	}, {
		key: '_getFormat',
		value: function _getFormat(options) {
			return !options || !options.format || this.exporter.type.formats.indexOf(options.format) < 0 ? this.format : options.format;
		}
	}]);

	return Converter;
}();

exports.Converter = Converter;