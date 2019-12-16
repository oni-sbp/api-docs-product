'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ = require('lodash');
var ConverterModel = require('oas-raml-converter-model');
var Converter = require('../converters/converter');
var SecurityScope = ConverterModel.SecurityScope;
var Method = ConverterModel.Method;
var SecurityDefinition = ConverterModel.SecurityDefinition;
var RamlMethodConverter = require('../raml/ramlMethodConverter');
var RamlAnnotationConverter = require('../raml/ramlAnnotationConverter');

var RamlSecurityDefinitionConverter = function (_Converter) {
	_inherits(RamlSecurityDefinitionConverter, _Converter);

	function RamlSecurityDefinitionConverter() {
		_classCallCheck(this, RamlSecurityDefinitionConverter);

		return _possibleConstructorReturn(this, (RamlSecurityDefinitionConverter.__proto__ || Object.getPrototypeOf(RamlSecurityDefinitionConverter)).apply(this, arguments));
	}

	_createClass(RamlSecurityDefinitionConverter, [{
		key: 'export',
		value: function _export(models) {
			var result = {};
			if (_.isEmpty(models)) return result;

			for (var i = 0; i < models.length; i++) {
				var model = models[i];
				result[model.schemaName] = this._export(model);
			}

			return result;
		}
	}, {
		key: '_export',
		value: function _export(model) {
			var attrIdMap = {};
			var attrIdSkip = ['type', 'signatures', 'authorization', 'authorizationUrl', 'tokenUrl', 'scopes', 'name', '_in', 'requestTokenUri', 'schemaName', 'describedBy', 'annotations'];
			var ramlDef = RamlSecurityDefinitionConverter.createRamlDef(model, attrIdMap, attrIdSkip);

			var settings = {};
			if (model.hasOwnProperty('type')) {
				var type = model.type;
				switch (type) {
					case 'oauth1':
						ramlDef.type = 'OAuth 1.0';
						if (model.hasOwnProperty('requestTokenUri')) settings.requestTokenUri = model.requestTokenUri;
						if (model.hasOwnProperty('authorizationUrl')) settings.authorizationUri = model.authorizationUrl;
						if (model.hasOwnProperty('tokenUrl')) settings.tokenCredentialsUri = model.tokenUrl;
						if (model.hasOwnProperty('signatures')) settings.signatures = model.signatures;
						break;

					case 'oauth2':
						ramlDef.type = 'OAuth 2.0';
						if (model.hasOwnProperty('authorizationUrl')) settings.authorizationUri = model.authorizationUrl;
						if (model.hasOwnProperty('tokenUrl')) settings.accessTokenUri = model.tokenUrl;

						if (model.hasOwnProperty('authorization') && model.authorization) {
							var grants = model.authorization;
							for (var i = 0; i < grants.length; i++) {
								switch (grants[i]) {
									case 'accessCode':
										grants[i] = 'authorization_code';
										break;
									case 'application':
										grants[i] = 'client_credentials';
										break;
								}
							}
							if (_.includes(grants, 'implicit') && !settings.hasOwnProperty('accessTokenUri')) {
								settings.accessTokenUri = '';
							}

							settings.authorizationGrants = grants;
						}

						if (model.hasOwnProperty('scopes')) {
							settings.scopes = [];
							var scopes = model.scopes;
							if (scopes) {
								for (var _i = 0; _i < scopes.length; _i++) {
									var scope = scopes[_i];
									settings.scopes.push(scope.value);
								}
							}
							if (_.isEmpty(settings.scopes)) {
								delete settings.scopes;
							}
						}
						break;

					case 'basic':
						ramlDef.type = 'Basic Authentication';
						break;

					case 'apiKey':
						ramlDef.type = 'Pass Through';
						break;

					case 'digest':
						ramlDef.type = 'Digest Authentication';
						break;

					default:
						ramlDef.type = type;
						break;
				}
			}

			if (!_.isEmpty(settings)) {
				ramlDef.settings = settings;
			}

			if (model.describedBy) {
				var methodConverter = new RamlMethodConverter(this.model);
				var describedBy = model.describedBy;
				var method = methodConverter._export(describedBy);
				delete method.displayName;
				ramlDef.describedBy = method;
			}

			RamlAnnotationConverter.exportAnnotations(this.model, this.annotationPrefix, this.def, model, ramlDef);

			return ramlDef;
		}
	}, {
		key: 'import',
		value: function _import(ramlDefs) {
			var result = [];
			if (_.isEmpty(ramlDefs)) return result;

			for (var id in ramlDefs) {
				if (!ramlDefs.hasOwnProperty(id)) continue;
				var securityDefName = Object.keys(ramlDefs[id])[0];
				var securityDef = ramlDefs[id][securityDefName];
				securityDef.name = securityDefName;
				var securityDefinition = this._import(securityDef);
				result.push(securityDefinition);
			}

			return result;
		}
	}, {
		key: '_import',
		value: function _import(ramlDef) {
			var attrIdMap = {
				'name': 'schemaName'
			};
			var attrIdSkip = ['type', 'settings', 'describedBy', 'authorizationGrants', 'sourceMap'];
			var model = RamlSecurityDefinitionConverter.createSecurityDefinition(ramlDef, attrIdMap, attrIdSkip);

			if (ramlDef.hasOwnProperty('type')) {
				var type = ramlDef.type;
				switch (type) {
					case 'OAuth 1.0':
						model.type = 'oauth1';
						break;
					case 'OAuth 2.0':
						model.type = 'oauth2';
						break;
					case 'Pass Through':
						model.type = 'apiKey';
						break;
					case 'Basic Authentication':
						model.type = 'basic';
						break;
					case 'Digest Authentication':
					case 'DigestSecurityScheme Authentication':
						model.type = 'digest';
						break;
					default:
						if (type.substr(0, 2) === 'x-') {
							model.type = type;
						} else {
							model.type = 'x-' + type;
						}
						break;
				}
			}

			if (ramlDef.hasOwnProperty('settings')) {
				var settings = ramlDef.settings;
				var attrSettingsIdMap = {
					'accessTokenUri': 'tokenUrl',
					'tokenCredentialsUri': 'tokenUrl',
					'authorizationUri': 'authorizationUrl',
					'authorizationGrants': 'authorization'
				};
				var attrSettingsIdSkip = ['scopes', 'authorizationGrants', 'sourceMap'];
				var settingsModel = RamlSecurityDefinitionConverter.createSecurityDefinition(settings, attrSettingsIdMap, attrSettingsIdSkip);
				_.merge(model, settingsModel);

				if (settings.hasOwnProperty('scopes')) {
					var scopes = [];
					for (var id in settings.scopes) {
						if (!settings.scopes.hasOwnProperty(id)) continue;
						var scope = new SecurityScope();
						scope.value = settings.scopes[id];
						scope.description = '';
						scopes.push(scope);
					}
					model.scopes = scopes;
				}

				if (settings.hasOwnProperty('authorizationGrants')) {
					var grants = settings.authorizationGrants;
					for (var i = 0; i < grants.length; i++) {
						switch (grants[i]) {
							case 'credentials':
							case 'client_credentials':
								grants[i] = 'application';
								break;
							case 'code':
							case 'authorization_code':
								grants[i] = 'accessCode';
								break;
							case 'token':
								grants[i] = 'implicit';
								break;
							case 'owner':
								grants[i] = 'password';
								break;
						}
					}
					model.authorization = grants;
				}
			}

			if (ramlDef.hasOwnProperty('describedBy')) {
				var methodConverter = new RamlMethodConverter();
				var describedBy = methodConverter._import(ramlDef.describedBy);
				model.describedBy = describedBy;
				model._in = 'header';
				if (describedBy.hasOwnProperty('headers') && describedBy.headers != null) {
					var header = describedBy.headers[0];
					if (header.hasOwnProperty('definition') && header.definition) {
						var name = header.definition.name;
						model.name = name;
					}
				} else if (describedBy.hasOwnProperty('parameters') && describedBy.parameters != null) {
					var parameter = describedBy.parameters[0];
					if (parameter.hasOwnProperty('definition') && parameter.definition) {
						var _name = parameter.name;
						model.name = _name;
					}
				}
			}

			return model;
		}
	}], [{
		key: 'createRamlDef',
		value: function createRamlDef(securityDefinition, attrIdMap, attrIdSkip) {
			var result = {};

			_.assign(result, securityDefinition);
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
		key: 'createSecurityDefinition',
		value: function createSecurityDefinition(ramlDef, attrIdMap, attrIdSkip) {
			var object = {};

			_.entries(ramlDef).map(function (_ref) {
				var _ref2 = _slicedToArray(_ref, 2),
				    key = _ref2[0],
				    value = _ref2[1];

				if (attrIdSkip.indexOf(key) < 0 && !key.startsWith('x-')) {
					object[attrIdMap.hasOwnProperty(key) ? attrIdMap[key] : key] = value;
				}
			});
			var result = new SecurityDefinition();
			_.assign(result, object);

			return result;
		}
	}]);

	return RamlSecurityDefinitionConverter;
}(Converter);

module.exports = RamlSecurityDefinitionConverter;