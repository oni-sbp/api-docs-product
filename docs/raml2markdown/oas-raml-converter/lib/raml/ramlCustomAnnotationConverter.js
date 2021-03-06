'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var RamlCustomAnnotationConverter = function () {
	function RamlCustomAnnotationConverter() {
		_classCallCheck(this, RamlCustomAnnotationConverter);
	}

	_createClass(RamlCustomAnnotationConverter, null, [{
		key: '_createAnnotationType',
		value: function _createAnnotationType(ramlDef, prefix, id, value) {
			var definition = void 0;
			switch (id) {
				case prefix + '-' + 'allowEmptyValue':
					definition = {
						type: 'boolean'
					};
					break;

				case prefix + '-' + 'tags':
					definition = {
						type: 'string[]',
						allowedTargets: 'Method'
					};
					break;

				case prefix + '-' + 'deprecated':
					definition = {
						type: 'boolean',
						allowedTargets: 'Method'
					};
					break;

				case prefix + '-' + 'summary':
					definition = {
						type: 'string',
						allowedTargets: 'Method'
					};
					break;

				case prefix + '-' + 'externalDocs':
					definition = {
						properties: {
							'description?': 'string',
							'url': 'string'
						},
						allowedTargets: ['API', 'Method', 'TypeDeclaration']
					};
					break;

				case prefix + '-' + 'info':
					definition = {
						properties: {
							'termsOfService?': 'string',
							'contact?': {
								properties: {
									'name?': 'string',
									'url?': 'string',
									'email?': 'string'
								}
							},
							'license?': {
								properties: {
									'name?': 'string',
									'url?': 'string'
								}
							}
						},
						allowedTargets: 'API'
					};
					break;

				case prefix + '-' + 'schema-title':
				case prefix + '-' + 'property-title':
				case prefix + '-' + 'body-name':
				case prefix + '-' + 'responses-example':
					definition = {
						type: 'string',
						allowedTargets: 'TypeDeclaration'
					};
					break;

				case prefix + '-' + 'responses-default':
					definition = {
						type: 'any',
						allowedTargets: 'Method'
					};
					break;

				case prefix + '-' + 'global-response-definition':
					definition = {
						type: 'any',
						allowedTargets: 'Response'
					};
					break;

				case prefix + '-' + 'definition-name':
					definition = {
						type: 'string',
						allowedTargets: 'TypeDeclaration'
					};
					break;

				case prefix + '-' + 'collectionFormat':
					definition = {
						type: 'string'
					};
					break;

				case prefix + '-' + 'format':
					definition = {
						type: 'string',
						allowedTargets: 'TypeDeclaration'
					};
					break;

				case prefix + '-' + 'readOnly':
					definition = {
						type: 'boolean',
						allowedTargets: 'TypeDeclaration'
					};
					break;

				case prefix + '-' + 'responses':
					definition = 'any';
					break;

				case prefix + '-' + 'exclusiveMaximum':
				case prefix + '-' + 'exclusiveMinimum':
					definition = {
						type: 'boolean'
					};
					break;

				case prefix + '-' + 'maximum':
				case prefix + '-' + 'minimum':
					definition = {
						allowedTargets: 'TypeDeclaration',
						type: 'number'
					};
					break;

				case prefix + '-' + 'paths':
					definition = {
						allowedTargets: 'API',
						type: 'any'
					};
					break;

				case prefix + '-' + 'tags-definition':
					definition = {
						allowedTargets: 'API',
						type: 'array',
						items: {
							properties: {
								name: 'string',
								'description?': 'string',
								'externalDocs?': {
									properties: {
										url: 'string',
										'description?': 'string'
									}
								}
							}
						}
					};
					break;

				default:
					definition = 'any';
					break;
			}
			if (value === null) definition = 'nil';
			if (!ramlDef.annotationTypes) ramlDef.annotationTypes = {};
			if (!ramlDef.annotationTypes.hasOwnProperty(id)) ramlDef.annotationTypes[id] = definition;
		}
	}]);

	return RamlCustomAnnotationConverter;
}();

module.exports = RamlCustomAnnotationConverter;