'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ = require('lodash');
var ConverterModel = require('oas-raml-converter-model');
var Trait = ConverterModel.Trait;
var Method = ConverterModel.Method;
var Converter = require('../converters/converter');
var Oas20MethodConverter = require('../oas20/oas20MethodConverter');

var Oas20TraitConverter = function (_Converter) {
	_inherits(Oas20TraitConverter, _Converter);

	function Oas20TraitConverter(model, dereferencedAPI) {
		_classCallCheck(this, Oas20TraitConverter);

		var _this = _possibleConstructorReturn(this, (Oas20TraitConverter.__proto__ || Object.getPrototypeOf(Oas20TraitConverter)).call(this, model));

		_this.dereferencedAPI = dereferencedAPI;
		return _this;
	}

	_createClass(Oas20TraitConverter, [{
		key: 'export',
		value: function _export(models) {
			if (_.isEmpty(models)) return {};

			var traits = {};
			for (var i = 0; i < models.length; i++) {
				var model = models[i];
				var method = model.method;
				if (method) traits[model.name] = this._export(method);
			}

			var paramsResult = {};
			var responsesResult = {};
			for (var id in traits) {
				if (!traits.hasOwnProperty(id)) continue;

				var trait = traits[id];
				for (var index in trait.parameters) {
					if (!trait.parameters.hasOwnProperty(index)) continue;

					var param = trait.parameters[index];
					var name = 'trait:' + id + ':' + index;
					paramsResult[name] = param;
				}
				for (var _index in trait.responses) {
					if (!trait.responses.hasOwnProperty(_index)) continue;

					var _param = trait.responses[_index];
					var _name = 'trait:' + id + ':' + _index;
					responsesResult[_name] = _param;
				}
			}

			return {
				parameters: paramsResult,
				responses: responsesResult
			};
		}

		// exports 1 trait definition

	}, {
		key: '_export',
		value: function _export(model) {
			var methodConverter = new Oas20MethodConverter(this.model, this.dereferencedAPI, '', this.def);

			var methodResult = methodConverter._export(model);
			var paramsResult = {};
			if (methodResult.hasOwnProperty('parameters')) {
				for (var i = 0; i < methodResult.parameters.length; i++) {
					var paramResult = methodResult.parameters[i];
					if (paramResult.hasOwnProperty('example')) delete paramResult.example;
					if (!paramResult.hasParams) paramsResult[paramResult.name] = paramResult;
				}
			}
			var responsesResult = {};
			if (methodResult.hasOwnProperty('responses')) {
				for (var id in methodResult.responses) {
					if (!methodResult.responses.hasOwnProperty(id)) continue;

					var responseResult = methodResult.responses[id];
					if (id !== 'default' && !responseResult.hasParams && (id !== 'default' || responseResult.hasOwnProperty('schema') || responseResult.hasOwnProperty('headers') && !_.isEmpty(responseResult.description))) responsesResult[id] = methodResult.responses[id];
				}
			}

			return {
				parameters: paramsResult,
				responses: responsesResult
			};
		}
	}, {
		key: 'import',
		value: function _import(oasDefs) {
			var result = [];
			if (_.isEmpty(oasDefs)) return result;

			var traits = {};
			var traitNames = [];
			for (var id in oasDefs.parameters) {
				if (!oasDefs.parameters.hasOwnProperty(id)) continue;

				var oasDef = oasDefs.parameters[id];
				if (oasDef.in === 'path') continue;
				var traitName = Oas20TraitConverter.getTraitName(id);
				if (!traitNames.includes(traitName)) {
					traits[traitName] = { parameters: [oasDef] };
					traitNames.push(traitName);
				} else {
					var parameters = traits[traitName].parameters;
					parameters.push(oasDef);
				}
			}

			for (var _id in traits) {
				if (!traits.hasOwnProperty(_id)) continue;

				var model = new Trait();
				model.name = _id;
				this.currentParam = _id;
				var method = this._import(traits[_id]);
				model.method = method;
				result.push(model);
			}

			return result;
		}

		// imports 1 trait definition

	}, {
		key: '_import',
		value: function _import(oasDef) {
			var methodConverter = new Oas20MethodConverter(this.model, this.dereferencedAPI[this.currentParam], '', this.def);

			var result = methodConverter._import({ parameters: oasDef.parameters });
			if (result.hasOwnProperty('is')) delete result.is;

			return result;
		}
	}], [{
		key: 'getTraitName',
		value: function getTraitName(fullName) {
			var index = fullName.indexOf(':');
			return index < 0 ? fullName : fullName.substring(index + 1, fullName.lastIndexOf(':'));
		}
	}]);

	return Oas20TraitConverter;
}(Converter);

module.exports = Oas20TraitConverter;