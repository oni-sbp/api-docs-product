'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ = require('lodash');
var ConverterModel = require('oas-raml-converter-model');
var Root = ConverterModel.Root;
var Definition = ConverterModel.Definition;
var Annotation = ConverterModel.Annotation;
var Converter = require('../converters/converter');
var RamlCustomAnnotationConverter = require('../raml/ramlCustomAnnotationConverter');
var ramlHelper = require('../helpers/raml');

var RamlAnnotationConverter = function (_Converter) {
	_inherits(RamlAnnotationConverter, _Converter);

	function RamlAnnotationConverter() {
		_classCallCheck(this, RamlAnnotationConverter);

		return _possibleConstructorReturn(this, (RamlAnnotationConverter.__proto__ || Object.getPrototypeOf(RamlAnnotationConverter)).apply(this, arguments));
	}

	_createClass(RamlAnnotationConverter, [{
		key: '_export',
		value: function _export(model) {
			var ramlDef = {};
			var annotations = model.annotations;
			for (var i = 0; i < annotations.length; i++) {
				var value = annotations[i];
				this.exportAnnotation(ramlDef, value);
			}

			return ramlDef;
		}
	}, {
		key: 'exportAnnotation',
		value: function exportAnnotation(ramlDef, value) {
			var name = '(' + value.name + ')';
			ramlDef[name] = value.definition;
			if (value.hasOwnProperty('annotations') && !_.isEmpty(value.annotations) && value.annotations != null) {
				var annotations = value.annotations;
				for (var i = 0; i < annotations.length; i++) {
					var _value = annotations[i];
					this.exportAnnotation(ramlDef[name], _value);
				}
			}
			if (this.def) RamlCustomAnnotationConverter._createAnnotationType(this.def, this.annotationPrefix, value.name, value.definition);
		}
	}, {
		key: '_import',
		value: function _import(ramlDef) {
			var annotations = [];
			var skipAnnotations = ['oas-info', 'oas-tags-definition', 'oas-tags'];

			if (_typeof(ramlDef.annotations) === 'object') {
				for (var id in ramlDef.annotations) {
					if (!ramlDef.annotations.hasOwnProperty(id) || _.includes(skipAnnotations, id)) continue;

					var name = _.isArray(ramlDef.annotations) ? ramlDef.annotations[id].name.replace('(', '').replace(')', '') : id.replace('(', '').replace(')', '');
					var value = _.isArray(ramlDef.annotations) ? ramlDef.annotations[id].definition : ramlDef.annotations[id].hasOwnProperty('structuredValue') ? ramlDef.annotations[id].structuredValue : ramlDef.annotations[id];
					annotations.push(this.importAnnotation(name, value));
				}
			}

			if (_typeof(ramlDef.scalarsAnnotations) === 'object') {
				for (var _id in ramlDef.scalarsAnnotations) {
					if (!ramlDef.scalarsAnnotations.hasOwnProperty(_id)) continue;

					var _value2 = ramlDef.scalarsAnnotations[_id];
					if (_id === 'baseUri') {
						var _annotations = this.model.baseUri.annotations ? this.model.baseUri.annotations : [];
						for (var index in _value2) {
							if (!_value2.hasOwnProperty(index)) continue;

							var val = _value2[index];
							_annotations.push(this.importAnnotation(val.name, _value2[index].structuredValue));
							this.model.baseUri.annotations = _annotations;
						}
					}
				}
			}

			if (!ramlDef.hasOwnProperty('annotations') && !ramlDef.hasOwnProperty('scalarAnnotations')) {
				var annotationPrefix = ramlHelper.getAnnotationPrefix;
				for (var _id2 in ramlDef) {
					if (!ramlDef.hasOwnProperty(_id2)) continue;

					if (_typeof(ramlDef[_id2]) === 'object' && !_.isEmpty(ramlDef[_id2])) {
						var _annotations2 = this._import(ramlDef[_id2]);
						if (!_.isEmpty(_annotations2)) ramlDef[_id2].annotations = _annotations2;
					}
					if (_id2.startsWith(annotationPrefix)) {
						annotations.push(this.importAnnotation(_id2.substring(1, _id2.length - 1), ramlDef[_id2]));
						delete ramlDef[_id2];
					}
				}
			}

			return annotations;
		}
	}, {
		key: 'importAnnotation',
		value: function importAnnotation(name, value) {
			var annotationPrefix = ramlHelper.getAnnotationPrefix;
			var annotation = new Annotation();
			annotation.name = name;

			if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') {
				var annotations = [];
				for (var index in value) {
					if (!value.hasOwnProperty(index)) continue;

					var val = value[index];
					if (index.startsWith(annotationPrefix)) {
						annotations.push(this.importAnnotation(index.substring(1, index.length - 1), val));
						delete value[index];
					}
				}
				if (!_.isEmpty(annotations)) annotation.annotations = annotations;
			}

			if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && !_.isArray(value) && value != null) {
				var definition = new Definition();
				_.assign(definition, value);
				annotation.definition = definition;
			} else {
				annotation.definition = value;
			}

			return annotation;
		}
	}], [{
		key: 'exportAnnotations',
		value: function exportAnnotations(model, annotationPrefix, ramlDef, source, target) {
			if (source.hasOwnProperty('annotations') && _.isArray(source.annotations) && !_.isEmpty(source.annotations)) {
				var annotationConverter = new RamlAnnotationConverter(model, annotationPrefix, ramlDef);
				_.assign(target, annotationConverter._export(source));
			}
		}
	}, {
		key: 'importAnnotations',
		value: function importAnnotations(source, target, model) {
			if (source.hasOwnProperty('annotations') && !_.isEmpty(source.annotations) || source.hasOwnProperty('scalarsAnnotations') && !_.isEmpty(source.scalarsAnnotations)) {
				var annotationConverter = new RamlAnnotationConverter(model);
				var annotations = annotationConverter._import(source);
				if (!_.isEmpty(annotations)) target.annotations = annotations;
				if (target.definition) {
					var definition = target.definition;
					delete definition.annotations;
				}
			}
		}
	}]);

	return RamlAnnotationConverter;
}(Converter);

module.exports = RamlAnnotationConverter;