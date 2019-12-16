'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ = require('lodash');

var ConverterModel = require('oas-raml-converter-model');
var Converter = require('../converters/converter');
var BaseUri = ConverterModel.BaseUri;
var Root = ConverterModel.Root;
var Tag = ConverterModel.Tag;

var Oas30InfoConverter = require('./oas30InfoConverter');
var Oas30AnnotationConverter = require('./oas30AnnotationConverter');

var _require = require('./oas30Types'),
    ExternalDocumentation = _require.ExternalDocumentation,
    Model = _require.Model,
    Server = _require.Server,
    ServerVariable = _require.ServerVariable;

var OasTag = require('./oas30Types').Tag;
var OasInfo = require('./oas30Types').Info;

var Oas30RootConverter = function (_Converter) {
	_inherits(Oas30RootConverter, _Converter);

	function Oas30RootConverter() {
		_classCallCheck(this, Oas30RootConverter);

		return _possibleConstructorReturn(this, (Oas30RootConverter.__proto__ || Object.getPrototypeOf(Oas30RootConverter)).apply(this, arguments));
	}

	_createClass(Oas30RootConverter, [{
		key: 'export',
		value: function _export(model) {
			if (_.isEmpty(model)) return new Model();

			var oasDef = new Model(model.info != null ? new Oas30InfoConverter().export(model.info) : new OasInfo());

			if (model.externalDocs != null) {
				var externalDocs = new ExternalDocumentation(model.externalDocs.url || '');
				externalDocs.description = model.externalDocs.description;

				oasDef.externalDocs = externalDocs;

				Oas30RootConverter.exportAnnotations(model.externalDocs, oasDef);
			}

			if (model.baseUri != null) {
				var baseUri = model.baseUri;
				var host = baseUri.host,
				    basePath = baseUri.basePath,
				    protocol = baseUri.protocol;

				var servers = [];
				var variables = {};

				if (model.baseUriParameters != null) {
					var params = model.baseUriParameters;

					var _iteratorNormalCompletion = true;
					var _didIteratorError = false;
					var _iteratorError = undefined;

					try {
						for (var _iterator = params[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
							var param = _step.value;

							var var_ = new ServerVariable(param.name);
							var_.description = param.description;
							if (param.definition != null && param.definition._enum != null) {
								var_.enum = param.definition._enum;
							}

							variables[param.name] = var_;
						}
					} catch (err) {
						_didIteratorError = true;
						_iteratorError = err;
					} finally {
						try {
							if (!_iteratorNormalCompletion && _iterator.return) {
								_iterator.return();
							}
						} finally {
							if (_didIteratorError) {
								throw _iteratorError;
							}
						}
					}
				}

				if (host != null) {
					var protocols = model.protocols || ['http'];
					if (protocol != null && !protocols.includes(protocol)) {
						protocols.push(protocol);
					}

					for (var i = 0; i < protocols.length; i++) {
						var _protocol = protocols[i];
						var url = _protocol + '://' + host + (basePath || '/');
						var server = new Server(url);
						if (!_.isEmpty(variables)) {
							server.variables = variables;
						}
						servers.push(server);
					}
				}

				oasDef.servers = servers;

				Oas30RootConverter.exportAnnotations(baseUri, oasDef);
			}

			if (model.tags != null) {
				var tags = model.tags;
				oasDef.tags = [];
				for (var _i = 0; _i < tags.length; _i++) {
					var tag = tags[_i];
					var result = new OasTag(tag.name);
					result.description = tag.description;

					if (tag.externalDocs != null) {
						var _externalDocs = new ExternalDocumentation(tag.externalDocs.url || '');
						_externalDocs.description = tag.externalDocs.description;
						result.externalDocs = _externalDocs;
					}
					if (!_.isEmpty(result) && oasDef.tags != null) {
						oasDef.tags.push(result);
					}
				}
			}

			Oas30RootConverter.exportAnnotations(model, oasDef);

			return oasDef;
		}
	}], [{
		key: 'exportAnnotations',
		value: function exportAnnotations(source, target) {
			if (source.annotations != null && _.isArray(source.annotations) && !_.isEmpty(source.annotations)) {
				var annotationConverter = new Oas30AnnotationConverter();
				_.assign(target, annotationConverter._export(source));
			}
		}
	}]);

	return Oas30RootConverter;
}(Converter);

module.exports = Oas30RootConverter;