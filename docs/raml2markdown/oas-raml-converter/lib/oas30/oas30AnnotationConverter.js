'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ = require('lodash');
var ConverterModel = require('oas-raml-converter-model');
var Annotation = ConverterModel.Annotation;
var Converter = require('../converters/converter');
var oasHelper = require('../helpers/oas20');

var Oas30AnnotationConverter = function (_Converter) {
	_inherits(Oas30AnnotationConverter, _Converter);

	function Oas30AnnotationConverter() {
		_classCallCheck(this, Oas30AnnotationConverter);

		return _possibleConstructorReturn(this, (Oas30AnnotationConverter.__proto__ || Object.getPrototypeOf(Oas30AnnotationConverter)).apply(this, arguments));
	}

	_createClass(Oas30AnnotationConverter, [{
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
				if (value.name === 'oas-body-name') {
					name = value.name.replace('oas-body-', '');
				} else if (value.name === 'oas-responses-default') {
					name = annotationPrefix + value.name.replace('oas-', '');
				} else {
					name = value.name.replace('oas-', '');
				}
			} else {
				name = annotationPrefix + value.name;
			}
			oasDef[name] = value.definition;
			if (value.annotations != null && !_.isEmpty(value.annotations)) {
				var annotations = value.annotations;
				for (var i = 0; i < annotations.length; i++) {
					this.exportAnnotation(oasDef[name], annotations[i]);
				}
			}
		}
	}]);

	return Oas30AnnotationConverter;
}(Converter);

module.exports = Oas30AnnotationConverter;