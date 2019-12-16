'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ = require('lodash');
var ConverterModel = require('oas-raml-converter-model');
var Definition = ConverterModel.Definition;
var Annotation = ConverterModel.Annotation;
var Converter = require('../converters/converter');
var oasHelper = require('../helpers/oas20');

var Oas20AnnotationConverter = function (_Converter) {
	_inherits(Oas20AnnotationConverter, _Converter);

	function Oas20AnnotationConverter() {
		_classCallCheck(this, Oas20AnnotationConverter);

		return _possibleConstructorReturn(this, (Oas20AnnotationConverter.__proto__ || Object.getPrototypeOf(Oas20AnnotationConverter)).apply(this, arguments));
	}

	_createClass(Oas20AnnotationConverter, [{
		key: '_export',
		value: function _export(model) {
			var oasDef = {};

			for (var id in model.annotations) {
				if (!model.annotations.hasOwnProperty(id)) continue;

				var annotation = model.annotations[id];
				var name = annotation.name;
				var excludedAnnotations = ['oas-deprecated', 'oas-paths', 'oas-collectionFormat', 'oas-schema-title', 'oas-global-response-definition', 'oas-responses', 'oas-definition-name'];
				if (_.includes(excludedAnnotations, name)) continue;
				this.exportAnnotation(oasDef, annotation);
			}

			return oasDef;
		}
	}, {
		key: 'exportAnnotation',
		value: function exportAnnotation(oasDef, value) {
			var oasValidFacets = ['oas-summary', 'oas-externalDocs', 'oas-readOnly', 'oas-responses-default', 'oas-format', 'oas-body-name'];
			var annotationPrefix = oasHelper.getAnnotationPrefix;
			var name = void 0;
			if (_.includes(oasValidFacets, value.name)) {
				if (value.name === 'oas-body-name') name = value.name.replace('oas-body-', '');else if (value.name === 'oas-responses-default') name = annotationPrefix + value.name.replace('oas-', '');else name = value.name.replace('oas-', '');
			} else {
				name = annotationPrefix + value.name;
			}
			oasDef[name] = value.definition;
			if (value.hasOwnProperty('annotations') && !_.isEmpty(value.annotations) && value.annotations != null) {
				var annotations = value.annotations;
				for (var i = 0; i < annotations.length; i++) {
					this.exportAnnotation(oasDef[name], annotations[i]);
				}
			}
		}
	}, {
		key: '_import',
		value: function _import(oasDef) {
			var annotations = [];
			var annotationPrefix = oasHelper.getAnnotationPrefix;

			for (var id in oasDef) {
				if (!oasDef.hasOwnProperty(id) || !id.startsWith(annotationPrefix) && !id.startsWith('x-') || id === 'x-basePath') continue;
				annotations.push(this.importAnnotation(id, oasDef[id]));
				delete oasDef[id];
			}

			return annotations;
		}
	}, {
		key: 'importAnnotation',
		value: function importAnnotation(id, value) {
			var annotationPrefix = id.startsWith(oasHelper.getAnnotationPrefix) ? oasHelper.getAnnotationPrefix : 'x-';

			var annotation = new Annotation();
			annotation.name = id.substring(annotationPrefix.length, id.length);

			if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') {
				var annotations = [];
				for (var index in value) {
					if (!value.hasOwnProperty(index) || !index.startsWith(annotationPrefix) && !index.startsWith('x-')) continue;

					var val = value[index];
					annotations.push(this.importAnnotation(index, val));
					delete value[index];
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
	}]);

	return Oas20AnnotationConverter;
}(Converter);

module.exports = Oas20AnnotationConverter;