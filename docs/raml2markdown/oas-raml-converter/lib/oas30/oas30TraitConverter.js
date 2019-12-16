'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ = require('lodash');

var ConverterModel = require('oas-raml-converter-model');
var Converter = require('../converters/converter');
var Trait = ConverterModel.Trait;
var Method = ConverterModel.Method;

var Oas30MethodConverter = require('./oas30MethodConverter');

var _require = require('./oas30Types'),
    Operation = _require.Operation;

var Oas30TraitConverter = function (_Converter) {
	_inherits(Oas30TraitConverter, _Converter);

	function Oas30TraitConverter(model, dereferencedAPI) {
		_classCallCheck(this, Oas30TraitConverter);

		var _this = _possibleConstructorReturn(this, (Oas30TraitConverter.__proto__ || Object.getPrototypeOf(Oas30TraitConverter)).call(this, model));

		_this.dereferencedAPI = dereferencedAPI;
		return _this;
	}

	_createClass(Oas30TraitConverter, [{
		key: 'export',
		value: function _export(models) {
			if (_.isEmpty(models)) return {};

			var traits = {};
			for (var i = 0; i < models.length; i++) {
				var model = models[i];
				if (model.method != null) traits[model.name] = this._export(model.method);
			}

			var paramsResult = {};
			var responsesResult = {};
			for (var id in traits) {
				if (!traits.hasOwnProperty(id)) continue;

				var trait = traits[id];
				for (var index in trait.parameters) {
					if (!trait.parameters.hasOwnProperty(index)) continue;

					var param = trait.parameters[index];
					var name = 'trait_' + id + '_' + index;
					paramsResult[name] = param;
				}
				for (var _index in trait.responses) {
					if (!trait.responses.hasOwnProperty(_index)) continue;

					var _param = trait.responses[_index];
					var _name = 'trait_' + id + '_' + _index;
					responsesResult[_name] = _param;
				}
			}

			return {
				parameters: paramsResult,
				responses: responsesResult
			};
		}
	}, {
		key: '_export',
		value: function _export(model) {
			var methodConverter = new Oas30MethodConverter(this.model, this.dereferencedAPI, '', this.def);

			var methodResult = methodConverter._export(model);
			var paramsResult = {};
			if (methodResult.parameters != null) {
				for (var i = 0; i < methodResult.parameters.length; i++) {
					var paramResult = methodResult.parameters[i];
					if (paramResult.example != null) delete paramResult.example;
					// $ExpectError sorry, but I don't really know how to fix it and it works as intended
					if (paramResult.hasParams == null) paramsResult[paramResult.name] = paramResult;
				}
			}
			var responsesResult = {};
			if (methodResult.responses != null) {
				for (var id in methodResult.responses) {
					if (!methodResult.responses.hasOwnProperty(id)) continue;

					var responseResult = methodResult.responses[id];
					// $ExpectError sorry, but I don't really know how to fix it and it works as intended
					if (id !== 'default' && !responseResult.hasParams && (id !== 'default' || responseResult.schema != null || responseResult.headers != null && !_.isEmpty(responseResult.description))) responsesResult[id] = methodResult.responses[id];
				}
			}

			return {
				parameters: paramsResult,
				responses: responsesResult
			};
		}
	}]);

	return Oas30TraitConverter;
}(Converter);

module.exports = Oas30TraitConverter;