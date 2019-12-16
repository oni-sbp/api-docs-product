'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ = require('lodash');
var ConverterModel = require('oas-raml-converter-model');
var Root = ConverterModel.Root;
var Parameter = ConverterModel.Parameter;
var Annotation = ConverterModel.Annotation;
var Definition = ConverterModel.Definition;
var Converter = require('../converters/converter');
var RamlDefinitionConverter = require('../raml/ramlDefinitionConverter');
var RamlAnnotationConverter = require('../raml/ramlAnnotationConverter');
var ramlHelper = require('../helpers/raml');

var ParameterConverter = function (_Converter) {
	_inherits(ParameterConverter, _Converter);

	function ParameterConverter(model, annotationPrefix, ramlDef, _in) {
		_classCallCheck(this, ParameterConverter);

		var _this = _possibleConstructorReturn(this, (ParameterConverter.__proto__ || Object.getPrototypeOf(ParameterConverter)).call(this, model, annotationPrefix, ramlDef));

		if (!_.isEmpty(_in)) _this._in = _in;
		return _this;
	}

	_createClass(ParameterConverter, [{
		key: 'export',
		value: function _export(models, exportRaml) {
			var result = {};
			if (_.isEmpty(models)) return result;

			for (var i = 0; i < models.length; i++) {
				var model = models[i];
				if (model && !model.hasOwnProperty('reference') && (!this._in || model._in === this._in)) result[model.name] = this._export(model, exportRaml);
			}

			return result;
		}

		// exports 1 parameter definition

	}, {
		key: '_export',
		value: function _export(model, exportRaml) {
			var definitionConverter = new RamlDefinitionConverter(this.model, this.annotationPrefix, this.def);

			var definition = model.definition;
			var ramlDef = definitionConverter._export(definition);
			if (!exportRaml && model._in === 'header' && (ramlDef.type && !ramlHelper.getBuiltinTypes.includes(ramlDef.type) || !ramlDef.type)) ramlDef.type = 'string';

			if (model.hasOwnProperty('displayName')) ramlDef.displayName = model.displayName;
			if (model.hasOwnProperty('annotations')) {
				var annotationConverter = new RamlAnnotationConverter(this.model, this.annotationPrefix, this.def);
				_.assign(ramlDef, annotationConverter._export(model));
			}
			ParameterConverter.exportRequired(model, ramlDef);

			return ramlDef;
		}
	}, {
		key: '_import',


		// imports 1 parameter definition
		value: function _import(ramlDef) {
			var definitionConverter = new RamlDefinitionConverter();

			var model = new Parameter();
			model.name = ramlDef.name;
			if (ramlDef.hasOwnProperty('displayName')) {
				model.displayName = ramlDef.displayName;
				delete ramlDef.displayName;
			}
			var definition = definitionConverter._import(ramlDef);
			if (!ramlDef.hasOwnProperty('type') && definition) delete definition.internalType;
			ParameterConverter.importRequired(ramlDef, model);
			if (ramlDef.hasOwnProperty('annotations') && !_.isEmpty(ramlDef.annotations)) {
				var annotationConverter = new RamlAnnotationConverter();
				var annotations = annotationConverter._import(ramlDef);
				if (!_.isEmpty(annotations)) model.annotations = annotations;
				delete definition.annotations;
			}
			model.definition = definition;

			return model;
		}
	}], [{
		key: 'exportRequired',
		value: function exportRequired(source, target) {
			if (source.hasOwnProperty('required')) target.required = source.required;
			if (target.hasOwnProperty('required') && target.required) delete target.required;
		}
	}, {
		key: 'importRequired',
		value: function importRequired(source, target) {
			target.required = source.hasOwnProperty('required') ? source.required : true;
		}
	}]);

	return ParameterConverter;
}(Converter);

module.exports = ParameterConverter;