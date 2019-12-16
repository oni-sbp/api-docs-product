'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ = require('lodash');
var ConverterModel = require('oas-raml-converter-model');
var Converter = require('../converters/converter');
var Info = ConverterModel.Info;
var MediaType = ConverterModel.MediaType;
var BaseUri = ConverterModel.BaseUri;
var Root = ConverterModel.Root;
var Resource = ConverterModel.Resource;
var Parameter = ConverterModel.Parameter;
var Header = ConverterModel.Header;
var Body = ConverterModel.Body;
var Definition = ConverterModel.Definition;
var Tag = ConverterModel.Tag;
var Item = ConverterModel.Item;
var Annotation = ConverterModel.Annotation;
var Response = ConverterModel.Response;
var ExternalDocumentation = ConverterModel.ExternalDocumentation;
var RamlInfoConverter = require('../raml/ramlInfoConverter');
var RamlDefinitionConverter = require('../raml/ramlDefinitionConverter');
var ParameterConverter = require('../common/parameterConverter');
var RamlAnnotationConverter = require('../raml/ramlAnnotationConverter');
var RamlCustomAnnotationConverter = require('../raml/ramlCustomAnnotationConverter');
var urlHelper = require('../utils/url');

var RamlRootConverter = function (_Converter) {
	_inherits(RamlRootConverter, _Converter);

	function RamlRootConverter(model) {
		_classCallCheck(this, RamlRootConverter);

		return _possibleConstructorReturn(this, (RamlRootConverter.__proto__ || Object.getPrototypeOf(RamlRootConverter)).call(this, model, 'oas'));
	}

	_createClass(RamlRootConverter, [{
		key: 'export',
		value: function _export(model) {
			return _.isEmpty(model) ? {} : this._export(model);
		}
	}, {
		key: '_export',
		value: function _export(model) {
			var attrIdMap = {};
			var attrIdSkip = ['info', 'baseUri', 'baseUriParameters', 'mediaType', 'protocols', 'securityDefinitions', 'resources', 'types', 'resourceTypes', 'annotations', 'resourceAnnotations', 'tags', 'externalDocs', 'responses', 'documentation', 'error', 'warning'];
			var ramlDef = RamlRootConverter.createRamlDef(model, attrIdMap, attrIdSkip);

			if (model.hasOwnProperty('info')) {
				var infoConverter = new RamlInfoConverter(this.model, this.annotationPrefix, ramlDef);
				var info = model.info;
				_.merge(ramlDef, infoConverter.export(info));
			}

			if (model.hasOwnProperty('tags') && model.tags) {
				var tags = model.tags;
				var tagsDef = [];
				for (var i = 0; i < tags.length; i++) {
					var tag = tags[i];
					var result = {};
					if (tag.hasOwnProperty('name')) result.name = tag.name;
					if (tag.hasOwnProperty('description')) result.description = tag.description;
					if (tag.hasOwnProperty('externalDocs')) {
						var externalDocs = tag.externalDocs;
						result.externalDocs = externalDocs;
					}
					if (!_.isEmpty(result)) {
						tagsDef.push(result);
					}
				}
				if (!_.isEmpty(tagsDef)) {
					var id = this.annotationPrefix + '-tags-definition';
					RamlCustomAnnotationConverter._createAnnotationType(ramlDef, this.annotationPrefix, id);
					ramlDef['(' + id + ')'] = tagsDef;
				}
			}

			if (model.hasOwnProperty('mediaType') && model.mediaType) {
				var mediaType = model.mediaType;
				if (mediaType.mimeTypes.length > 1) {
					ramlDef.mediaType = mediaType.mimeTypes;
				} else {
					ramlDef.mediaType = mediaType.mimeTypes[0];
				}
			}

			if (model.hasOwnProperty('protocols') && model.protocols) {
				var protocolsModel = model.protocols;
				var protocols = [];
				for (var _i = 0; _i < protocolsModel.length; _i++) {
					var protocolModel = protocolsModel[_i];
					protocols.push(protocolModel.toUpperCase());
				}
				ramlDef.protocols = protocols;
			}

			if (model.hasOwnProperty('baseUriParameters') && model.baseUriParameters) {
				var baseUriParameters = model.baseUriParameters;
				if (_.isArray(baseUriParameters) && !_.isEmpty(baseUriParameters)) {
					var parameterConverter = new ParameterConverter(this.model, this.annotationPrefix, this.def, '');
					ramlDef.baseUriParameters = parameterConverter.export(baseUriParameters);
				}
			}

			if (model.hasOwnProperty('baseUri') && model.baseUri) {
				var baseUri = model.baseUri;
				if (baseUri.hasOwnProperty('annotations')) {
					var annotationConverter = new RamlAnnotationConverter(this.model, this.annotationPrefix, ramlDef);
					ramlDef.baseUri = { value: baseUri.uri };
					_.assign(ramlDef.baseUri, annotationConverter._export(baseUri));
				} else ramlDef.baseUri = baseUri.uri;
			}

			if (model.hasOwnProperty('documentation') && model.documentation) {
				var documentationModel = model.documentation;
				var documentation = [];
				for (var _i2 = 0; _i2 < documentationModel.length; _i2++) {
					var item = documentationModel[_i2];
					var doc = {
						title: item.name,
						content: item.value
					};
					documentation.push(doc);
				}
				ramlDef.documentation = documentation;
			}

			if (model.hasOwnProperty('responses') && model.responses) {
				var responsesModel = model.responses;
				var responses = {};
				for (var _i3 = 0; _i3 < responsesModel.length; _i3++) {
					var response = responsesModel[_i3];
					var responseDef = {};
					if (response.hasOwnProperty('description')) responseDef.description = response.description;
					var headersDef = {};
					var definitionConverter = new RamlDefinitionConverter();
					if (response.hasOwnProperty('headers') && response.headers) {
						var headers = response.headers;
						for (var j = 0; j < headers.length; j++) {
							var header = headers[j];
							var definition = header.definition;
							headersDef[header.name] = definitionConverter._export(definition);
						}
						if (!_.isEmpty(headersDef)) responseDef.headers = headersDef;
					}
					if (response.hasOwnProperty('bodies') && response.bodies) {
						var bodies = response.bodies;
						for (var _j = 0; _j < bodies.length; _j++) {
							var body = bodies[_j];
							var _definition = body.definition;
							responseDef.body = definitionConverter._export(_definition);
						}
					}
					var name = response.name;
					if (name) responses[name] = responseDef;
				}

				if (!_.isEmpty(responses)) {
					var _id = this.annotationPrefix + '-responses';
					RamlCustomAnnotationConverter._createAnnotationType(ramlDef, this.annotationPrefix, _id);
					ramlDef['(' + _id + ')'] = responses;
				}
			}

			if (model.hasOwnProperty('externalDocs') && model.externalDocs) {
				var externalDocsModel = model.externalDocs;
				var _id2 = this.annotationPrefix + '-externalDocs';
				RamlCustomAnnotationConverter._createAnnotationType(ramlDef, this.annotationPrefix, _id2);
				var _externalDocs = {};
				if (externalDocsModel.hasOwnProperty('url')) _externalDocs.url = externalDocsModel.url;
				if (externalDocsModel.hasOwnProperty('description')) _externalDocs.description = externalDocsModel.description;
				RamlAnnotationConverter.exportAnnotations(this.model, this.annotationPrefix, ramlDef, externalDocsModel, _externalDocs);
				ramlDef['(' + _id2 + ')'] = _externalDocs;
			}
			if (model.hasOwnProperty('resourceAnnotations') && model.resourceAnnotations) {
				var resourceAnnotationsModel = model.resourceAnnotations;
				var _id3 = this.annotationPrefix + '-paths';
				RamlCustomAnnotationConverter._createAnnotationType(ramlDef, this.annotationPrefix, _id3);
				var resourceAnnotations = {};
				RamlAnnotationConverter.exportAnnotations(this.model, this.annotationPrefix, ramlDef, resourceAnnotationsModel, resourceAnnotations);
				ramlDef['(' + _id3 + ')'] = resourceAnnotations;
			}
			RamlAnnotationConverter.exportAnnotations(this.model, this.annotationPrefix, ramlDef, model, ramlDef);

			return ramlDef;
		}
	}, {
		key: 'import',
		value: function _import(ramlDef) {
			return _.isEmpty(ramlDef) ? new Root() : this._import(ramlDef);
		}
	}, {
		key: '_import',
		value: function _import(ramlDef) {
			var model = new Root();

			var infoConverter = new RamlInfoConverter(model);
			infoConverter.version = this.version;
			model.info = infoConverter.import(ramlDef);

			if (ramlDef.hasOwnProperty('protocols')) {
				if (_.isArray(ramlDef.protocols)) {
					model.protocols = ramlDef.protocols.map(function (protocol) {
						return protocol.toLowerCase();
					});
				} else {
					model.protocols = [ramlDef.protocols.toLowerCase()];
				}
			}

			if (ramlDef.baseUri != null) {
				var baseUri = new BaseUri();
				var uri = ramlDef.baseUri;
				baseUri.uri = uri;
				var parsedURL = urlHelper.parseURL(uri);

				if (parsedURL.host != null && baseUri.uri != null) {
					var host = parsedURL.host;
					var index = baseUri.uri.indexOf(host);
					if (baseUri.uri != null && baseUri.uri.charAt(index + host.length) !== '{') {
						baseUri.host = host;
					}
				}
				if (parsedURL.pathname != null && parsedURL.pathname !== '/') {
					var basePath = parsedURL.pathname.replace(/%7B/g, '{').replace(/%7D/g, '}');
					if (!basePath.startsWith('{')) {
						baseUri.basePath = basePath;
					}
				}
				if (parsedURL.protocol != null) {
					baseUri.protocol = parsedURL.protocol.toLowerCase();
					if (model.protocols != null && baseUri.protocol != null && !_.includes(model.protocols, baseUri.protocol)) {
						model.protocols.push(baseUri.protocol);
					} else if (model.protocols == null && baseUri.protocol != null) {
						model.protocols = [baseUri.protocol];
					}
				}
				model.baseUri = baseUri;
				RamlAnnotationConverter.importAnnotations(ramlDef.baseUri, model, model);
			}

			if (ramlDef.hasOwnProperty('baseUriParameters')) {
				if (!_.isEmpty(ramlDef.baseUriParameters)) {
					var parameterConverter = new ParameterConverter(this.model, this.annotationPrefix, this.def, '');
					var baseUriParameters = [];
					for (var id in ramlDef.baseUriParameters) {
						if (!ramlDef.baseUriParameters.hasOwnProperty(id)) continue;

						var parameter = parameterConverter._import(ramlDef.baseUriParameters[id]);
						baseUriParameters.push(parameter);
					}
					model.baseUriParameters = baseUriParameters;
				}
			}

			if (ramlDef.hasOwnProperty('mediaType')) {
				var mediaType = new MediaType();
				var mimeTypes = _.isArray(ramlDef.mediaType) ? ramlDef.mediaType : [ramlDef.mediaType];
				var mimes = [];
				for (var i = 0; i < mimeTypes.length; i++) {
					var mimeType = mimeTypes[i];
					if (!_.includes(mimes, mimeType)) mimes.push(mimeType);
				}
				mediaType.mimeTypes = mimeTypes;
				if (!_.isEmpty(mimes)) {
					mediaType.consumes = mimes;
					mediaType.produces = mimes;
				}
				model.mediaType = mediaType;
			}

			if (ramlDef.hasOwnProperty('documentation')) {
				var documentation = [];
				for (var _i4 = 0; _i4 < ramlDef.documentation.length; _i4++) {
					var doc = ramlDef.documentation[_i4];
					var item = new Item();
					item.name = doc.title;
					item.value = doc.content;
					documentation.push(item);
				}

				model.documentation = documentation;
			}

			if (ramlDef.hasOwnProperty('annotations') || ramlDef.hasOwnProperty('scalarsAnnotations')) {
				var annotationsDef = ramlDef.annotations;
				if (annotationsDef.hasOwnProperty('oas-tags-definition')) {
					var tagDef = annotationsDef['oas-tags-definition'];
					delete ramlDef.annotations['oas-tags-definition'];
					var tags = model.tags ? model.tags : [];
					if (tagDef.hasOwnProperty('structuredValue')) {
						var structuredValue = tagDef.structuredValue;
						structuredValue.map(function (value) {
							var tag = new Tag();
							tag.name = value.name;
							if (value.hasOwnProperty('description')) tag.description = value.description;
							if (value.hasOwnProperty('externalDocs')) {
								var externalDocs = value.externalDocs;
								var result = new ExternalDocumentation();
								if (externalDocs.hasOwnProperty('description')) result.description = externalDocs.description;
								if (externalDocs.hasOwnProperty('url')) result.url = externalDocs.url;
								if (!_.isEmpty(result)) {
									tag.externalDocs = result;
								}
							}
							if (!_.isEmpty(tag)) {
								tags.push(tag);
							}
						});
					}
					if (!_.isEmpty(tags)) {
						model.tags = tags;
					}
				}

				if (annotationsDef.hasOwnProperty('oas-externalDocs')) {
					var externalDocsDef = annotationsDef['oas-externalDocs'].structuredValue;
					delete ramlDef.annotations['oas-externalDocs'];
					var externalDocs = new ExternalDocumentation();
					if (externalDocsDef.hasOwnProperty('url')) externalDocs.url = externalDocsDef.url;
					if (externalDocsDef.hasOwnProperty('description')) externalDocs.description = externalDocsDef.description;
					if (!_.isEmpty(externalDocs)) model.externalDocs = externalDocs;
				}

				var annotationConverter = new RamlAnnotationConverter(model);
				var annotations = annotationConverter._import(ramlDef);
				if (!_.isEmpty(annotations)) model.annotations = annotations;
			}

			return model;
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
		key: 'createRamlDef',
		value: function createRamlDef(root, attrIdMap, attrIdSkip) {
			var result = {};

			_.assign(result, root);
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

	return RamlRootConverter;
}(Converter);

module.exports = RamlRootConverter;