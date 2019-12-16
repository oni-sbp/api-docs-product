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
var RamlMethodConverter = require('../raml/ramlMethodConverter');
var helper = require('../helpers/converter');

var RamlTraitConverter = function (_Converter) {
	_inherits(RamlTraitConverter, _Converter);

	function RamlTraitConverter() {
		_classCallCheck(this, RamlTraitConverter);

		return _possibleConstructorReturn(this, (RamlTraitConverter.__proto__ || Object.getPrototypeOf(RamlTraitConverter)).apply(this, arguments));
	}

	_createClass(RamlTraitConverter, [{
		key: 'export',
		value: function _export(models) {
			var traits = models.traits;
			var result = {};

			if (_.isEmpty(traits)) return result;

			for (var i = 0; i < traits.length; i++) {
				var model = traits[i];
				result[model.name] = this._export(model);
			}

			return result;
		}

		// exports 1 trait definition

	}, {
		key: '_export',
		value: function _export(model) {
			var attrIdMap = {};

			var attrIdSkip = ['name', 'method'];
			var ramlDef = RamlTraitConverter.createRamlDef(model, attrIdMap, attrIdSkip);
			var methodConverter = new RamlMethodConverter(this.model, this.annotationPrefix, this.def);

			if (model.hasOwnProperty('method') && !_.isEmpty(model.method)) {
				var methodModel = model.method;
				var method = methodConverter._export(methodModel);
				delete method.displayName;
				for (var id in method) {
					if (!method.hasOwnProperty(id)) continue;

					ramlDef[id] = method[id];
				}
			}

			return ramlDef;
		}
	}, {
		key: 'import',
		value: function _import(ramlDefs) {
			var result = [];
			if (_.isEmpty(ramlDefs)) return result;

			helper.removePropertiesFromObject(ramlDefs, ['typePropertyKind', 'structuredExample', 'fixedFacets']);
			for (var id in ramlDefs) {
				if (!ramlDefs.hasOwnProperty(id)) continue;

				var ramlDef = ramlDefs[id];
				result.push(this._import(ramlDef));
			}
			return result;
		}

		// imports 1 trait definition

	}, {
		key: '_import',
		value: function _import(ramlDef) {
			var model = new Trait();
			var methodConverter = new RamlMethodConverter();
			methodConverter.version = this.version;

			if (!_.isEmpty(ramlDef)) {
				var traitName = Object.keys(ramlDef)[0];
				model.name = traitName;
				var def = ramlDef[traitName];
				if (def.hasOwnProperty('usage')) model.usage = def.usage;
				var method = methodConverter._import(def);
				if (!_.isEmpty(method)) model.method = method;
			}

			return model;
		}
	}], [{
		key: 'createRamlDef',
		value: function createRamlDef(trait, attrIdMap, attrIdSkip) {
			var result = {};

			_.assign(result, trait);
			attrIdSkip.map(function (id) {
				delete result[id];
			});
			_.keys(attrIdMap).map(function (id) {
				result[attrIdMap[id]] = result[id];
				delete result[id];
			});

			return result;
		}
	}]);

	return RamlTraitConverter;
}(Converter);

module.exports = RamlTraitConverter;