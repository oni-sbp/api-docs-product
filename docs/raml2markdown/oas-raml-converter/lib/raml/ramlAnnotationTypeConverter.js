'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ = require('lodash');
var Converter = require('../converters/converter');
var ConverterModel = require('oas-raml-converter-model');
var Definition = ConverterModel.Definition;
var AnnotationType = ConverterModel.AnnotationType;
var RamlDefinitionConverter = require('../raml/ramlDefinitionConverter');
var helper = require('../helpers/converter');

var RamlAnnotationTypeConverter = function (_Converter) {
	_inherits(RamlAnnotationTypeConverter, _Converter);

	function RamlAnnotationTypeConverter() {
		_classCallCheck(this, RamlAnnotationTypeConverter);

		return _possibleConstructorReturn(this, (RamlAnnotationTypeConverter.__proto__ || Object.getPrototypeOf(RamlAnnotationTypeConverter)).apply(this, arguments));
	}

	_createClass(RamlAnnotationTypeConverter, [{
		key: 'export',
		value: function _export(models) {
			var result = {};
			if (_.isEmpty(models)) return result;

			for (var i = 0; i < models.length; i++) {
				var model = models[i];
				result[model.name] = this._export(model);
			}

			return result;
		}

		// exports 1 annotation type definition

	}, {
		key: '_export',
		value: function _export(model) {
			var definitionConverter = new RamlDefinitionConverter(this.model, this.annotationPrefix, this.def);
			var ramlDef = void 0;
			if (model.hasOwnProperty('definition') && _typeof(model.definition) === 'object') {
				var definition = model.definition;
				ramlDef = definitionConverter._export(definition);
				if (model.hasOwnProperty('required') && !model.required) ramlDef.required = model.required;
				if (model.hasOwnProperty('displayName')) ramlDef.displayName = model.displayName;
				if (ramlDef.hasOwnProperty('allowedTargets') && _.isArray(ramlDef.allowedTargets) && ramlDef.allowedTargets.length === 1) {
					ramlDef.allowedTargets = ramlDef.allowedTargets[0];
				}
			} else if (typeof model.definition === 'string') {
				ramlDef = { type: model };
			}

			return ramlDef;
		}
	}, {
		key: 'import',
		value: function _import(ramlDefs) {
			var result = [];
			if (_.isEmpty(ramlDefs)) return result;

			helper.removePropertiesFromObject(ramlDefs, ['typePropertyKind']);
			for (var id in ramlDefs) {
				if (!ramlDefs.hasOwnProperty(id)) continue;

				var ramlDef = ramlDefs[id];
				var keys = Object.keys(ramlDef);
				if (!_.isEmpty(keys) && keys.length === 1) {
					var name = keys[0];
					var anntoationType = this._import(ramlDef[name]);
					result.push(anntoationType);
				}
			}

			return result;
		}
	}, {
		key: '_import',
		value: function _import(ramlDef) {
			var definitionConverter = new RamlDefinitionConverter();
			var model = new AnnotationType();
			var definition = definitionConverter._import(ramlDef);
			model.definition = definition;
			if (definition.hasOwnProperty('name')) model.name = definition.name;
			if (ramlDef.hasOwnProperty('displayName')) model.displayName = ramlDef.displayName;
			if (_.endsWith(ramlDef.type, '?')) model.required = false;
			if (model.definition.hasOwnProperty('title')) delete model.definition.title;

			return model;
		}
	}]);

	return RamlAnnotationTypeConverter;
}(Converter);

module.exports = RamlAnnotationTypeConverter;