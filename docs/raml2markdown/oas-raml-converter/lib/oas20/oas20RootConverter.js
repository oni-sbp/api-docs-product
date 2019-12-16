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
var Definition = ConverterModel.Definition;
var Header = ConverterModel.Header;
var Root = ConverterModel.Root;
var Response = ConverterModel.Response;
var Body = ConverterModel.Body;
var Tag = ConverterModel.Tag;
var ExternalDocumentation = ConverterModel.ExternalDocumentation;
var Annotation = ConverterModel.Annotation;
var Oas20InfoConverter = require('../oas20/oas20InfoConverter');
var Oas20AnnotationConverter = require('../oas20/oas20AnnotationConverter');
var Oas20DefinitionConverter = require('../oas20/oas20DefinitionConverter');
var urlHelper = require('../utils/url');
var url = require('url');
var oasHelper = require('../helpers/oas20');

var Oas20RootConverter = function (_Converter) {
	_inherits(Oas20RootConverter, _Converter);

	function Oas20RootConverter() {
		_classCallCheck(this, Oas20RootConverter);

		return _possibleConstructorReturn(this, (Oas20RootConverter.__proto__ || Object.getPrototypeOf(Oas20RootConverter)).apply(this, arguments));
	}

	_createClass(Oas20RootConverter, [{
		key: 'export',
		value: function _export(model) {
			return _.isEmpty(model) ? {} : this._export(model);
		}
	}, {
		key: '_export',
		value: function _export(model) {
			var attrIdMap = {};
			var attrIdSkip = ['info', 'baseUri', 'protocols', 'mediaType', 'documentation', 'baseUriParameters', 'securityDefinitions', 'resources', 'types', 'resourceTypes', 'traits', 'annotationTypes', 'tags', 'annotations'];
			var oasDef = Oas20RootConverter.createOasDef(model, attrIdMap, attrIdSkip);

			if (model.hasOwnProperty('info')) {
				var info = model.info;
				var infoConverter = new Oas20InfoConverter();
				oasDef.info = infoConverter.export(info);
			}

			if (model.hasOwnProperty('baseUri') && model.baseUri) {
				var baseUri = model.baseUri;
				if (baseUri.host != null && urlHelper.isTemplateUri(baseUri.host)) {
					oasDef['x-basePath'] = baseUri.host + (baseUri.basePath != null ? baseUri.basePath : '');
				} else {
					if (baseUri.hasOwnProperty('host') && !_.isEmpty(baseUri.host)) oasDef.host = baseUri.host;
					if (baseUri.hasOwnProperty('basePath') && !_.isEmpty(baseUri.basePath)) {
						if (urlHelper.isTemplateUri(baseUri.basePath)) {
							oasDef['x-basePath'] = baseUri.basePath;
						} else {
							oasDef.basePath = baseUri.basePath;
						}
					}
					if (!baseUri.host && !baseUri.basePath) {
						var uri = baseUri.uri;
						if (uri != null) {
							var parsedURL = url.parse(uri);
							oasDef['x-basePath'] = parsedURL.protocol ? uri.replace(parsedURL.protocol + '//', '') : uri;
						}
					}
				}
				Oas20RootConverter.exportAnnotations(baseUri, oasDef);
			}

			if (model.hasOwnProperty('protocols') && model.protocols) {
				var protocols = model.protocols;
				var schemes = [];
				for (var i = 0; i < protocols.length; i++) {
					var protocol = protocols[i];
					if (oasHelper.getAcceptedSchemes.includes(protocol)) schemes.push(protocol);
				}
				oasDef.schemes = schemes;
			}

			if (model.hasOwnProperty('tags') && model.tags) {
				var tags = model.tags;
				oasDef.tags = [];
				for (var _i = 0; _i < tags.length; _i++) {
					var tag = tags[_i];
					var result = {};
					if (tag.hasOwnProperty('name')) result.name = tag.name;
					if (tag.hasOwnProperty('description')) result.description = tag.description;
					if (tag.hasOwnProperty('externalDocs')) result.externalDocs = tag.externalDocs;
					if (!_.isEmpty(result)) {
						oasDef.tags.push(result);
					}
				}
			}

			if (model.hasOwnProperty('mediaType') && model.mediaType) {
				var mediaType = model.mediaType;
				if (mediaType.hasOwnProperty('consumes')) oasDef.consumes = mediaType.consumes;
				if (mediaType.hasOwnProperty('produces')) oasDef.produces = mediaType.produces;
			}

			if (oasDef.hasOwnProperty('responses')) {
				for (var id in oasDef.responses) {
					if (!oasDef.responses.hasOwnProperty(id)) continue;

					var response = oasDef.responses[id];
					if (!response.httpStatusCode) delete response.httpStatusCode;
				}
			}

			Oas20RootConverter.exportAnnotations(model, oasDef);

			return oasDef;
		}
	}, {
		key: 'import',
		value: function _import(oasDef) {
			return _.isEmpty(oasDef) ? {} : this._import(oasDef);
		}
	}, {
		key: '_import',
		value: function _import(oasDef) {
			var model = new Root();

			if (oasDef.hasOwnProperty('schemes')) {
				var protocols = oasDef.schemes;
				model.protocols = protocols;
			}

			if (oasDef.hasOwnProperty('info')) {
				var infoConverter = new Oas20InfoConverter(model);
				var info = infoConverter.import(oasDef.info);
				model.info = info;
			}

			if (oasDef.hasOwnProperty('tags')) {
				var tags = [];
				oasDef.tags.map(function (tag) {
					var result = new Tag();
					if (tag.hasOwnProperty('name')) result.name = tag.name;
					if (tag.hasOwnProperty('description')) result.description = tag.description;
					if (tag.hasOwnProperty('externalDocs')) {
						var externalDocs = new ExternalDocumentation();
						if (tag.externalDocs.hasOwnProperty('description')) externalDocs.description = tag.externalDocs.description;
						if (tag.externalDocs.hasOwnProperty('url')) externalDocs.url = tag.externalDocs.url;
						if (!_.isEmpty(externalDocs)) {
							result.externalDocs = externalDocs;
						}
					}
					if (!_.isEmpty(result)) tags.push(result);
				});
				if (!_.isEmpty(tags)) model.tags = tags;
			}

			if (oasDef.hasOwnProperty('externalDocs')) {
				var defExternalDocs = oasDef.externalDocs;
				var externalDocs = new ExternalDocumentation();
				if (defExternalDocs.hasOwnProperty('url')) externalDocs.url = defExternalDocs.url;
				if (defExternalDocs.hasOwnProperty('description')) externalDocs.description = defExternalDocs.description;
				Oas20RootConverter.importAnnotations(oasDef.externalDocs, externalDocs, this.model);
				if (!_.isEmpty(externalDocs)) {
					model.externalDocs = externalDocs;
				}
			}

			var baseUri = new BaseUri();
			if (oasDef.hasOwnProperty('x-basePath')) {
				baseUri.uri = oasDef['x-basePath'];
				if (oasDef.hasOwnProperty('host')) baseUri.host = oasDef.host;
				var uri = baseUri.uri;
				if (uri != null) {
					var parsedURL = url.parse(uri);
					if (parsedURL.host && !baseUri.host) {
						baseUri.host = parsedURL.host;
					}
				}
			} else {
				if (oasDef.hasOwnProperty('host')) baseUri.host = oasDef.host;
				if (oasDef.hasOwnProperty('basePath')) baseUri.basePath = oasDef.basePath;
				var baseProtocol = void 0;
				if (baseUri.host) {
					baseProtocol = model.protocols ? model.protocols[0] : 'http';
				}
				baseUri.uri = (baseProtocol ? baseProtocol + '://' : '') + (baseUri.host ? baseUri.host : '') + (baseUri.basePath ? baseUri.basePath : '');
			}
			if (!_.isEmpty(baseUri) && baseUri.uri !== '') model.baseUri = baseUri;

			var mediaType = new MediaType();
			if (oasDef.hasOwnProperty('consumes')) {
				var mimeTypes = mediaType.mimeTypes;
				var consumes = oasDef.consumes;
				mediaType.consumes = consumes;
				if (_.isEmpty(mimeTypes)) {
					mediaType.mimeTypes = consumes;
				} else {
					var intersection = _.intersection(mimeTypes, consumes);
					mediaType.mimeTypes = mimeTypes.concat(consumes.filter(function (type) {
						return !intersection.includes(type);
					}));
				}
			}
			if (oasDef.hasOwnProperty('produces')) {
				var _mimeTypes = mediaType.mimeTypes;
				var produces = oasDef.produces;
				mediaType.produces = produces;
				if (_.isEmpty(_mimeTypes)) {
					mediaType.mimeTypes = produces;
				} else {
					var _intersection = _.intersection(_mimeTypes, produces);
					mediaType.mimeTypes = _mimeTypes.concat(produces.filter(function (type) {
						return !_intersection.includes(type);
					}));
				}
			}
			if (!_.isEmpty(mediaType)) {
				model.mediaType = mediaType;
			}

			if (oasDef.hasOwnProperty('responses') && !_.isEmpty(oasDef.responses)) {
				var definitionConverter = new Oas20DefinitionConverter();
				var responses = [];
				for (var name in oasDef.responses) {
					if (!oasDef.responses.hasOwnProperty(name)) continue;

					var response = oasDef.responses[name];
					var responseModel = new Response();
					responseModel.httpStatusCode = response.code;
					responseModel.name = name;
					if (response.hasOwnProperty('description')) responseModel.description = response.description;
					if (response.hasOwnProperty('schema')) {
						var bodyModel = new Body();
						var definition = definitionConverter._import(response.schema);
						bodyModel.definition = definition;
						var bodies = [bodyModel];
						responseModel.bodies = bodies;
					}
					if (response.hasOwnProperty('headers')) {
						var headers = [];
						for (var headerName in response.headers) {
							var header = response.headers[headerName];
							var headerModel = new Header();
							headerModel.name = headerName;
							var _definition = definitionConverter._import(header);
							headerModel.definition = _definition;
							headers.push(headerModel);
						}
						responseModel.headers = headers;
					}
					responses.push(responseModel);
				}
				model.responses = responses;
			}

			if (oasDef.hasOwnProperty('security')) {
				model.securedBy = [];
				oasDef.security.map(function (sec) {
					var key = _.keys(sec)[0];
					var obj = {};
					obj[key] = { scopes: sec[key] };
					model.securedBy = model.securedBy.concat(sec[key].length === 0 ? key : obj);
				});
			}

			Oas20RootConverter.importAnnotations(oasDef, model, model);

			return model;
		}
	}], [{
		key: 'exportAnnotations',
		value: function exportAnnotations(source, target) {
			if (source.hasOwnProperty('annotations') && _.isArray(source.annotations) && !_.isEmpty(source.annotations)) {
				var annotationConverter = new Oas20AnnotationConverter();
				_.assign(target, annotationConverter._export(source));
			}
		}
	}, {
		key: 'createOasDef',
		value: function createOasDef(root, attrIdMap, attrIdSkip) {
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
	}, {
		key: 'importAnnotations',
		value: function importAnnotations(source, target, model) {
			var annotationConverter = new Oas20AnnotationConverter(model);
			var annotations = annotationConverter._import(source);
			if (!_.isEmpty(annotations)) target.annotations = annotations;
		}
	}]);

	return Oas20RootConverter;
}(Converter);

module.exports = Oas20RootConverter;