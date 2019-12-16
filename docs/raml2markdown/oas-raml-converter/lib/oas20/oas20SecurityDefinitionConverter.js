'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Converter = require('../converters/converter');
var ConverterModel = require('oas-raml-converter-model');
var _ = require('lodash');
var SecurityScope = ConverterModel.SecurityScope;
var Method = ConverterModel.Method;
var SecurityDefinition = ConverterModel.SecurityDefinition;
var RamlMethodConverter = require('../raml/ramlMethodConverter');
var Oas20RootConverter = require('../oas20/oas20RootConverter');
var oasHelper = require('../helpers/oas20');

var Oas20SecurityDefinitionConverter = function (_Converter) {
	_inherits(Oas20SecurityDefinitionConverter, _Converter);

	function Oas20SecurityDefinitionConverter(model, dereferencedAPI) {
		_classCallCheck(this, Oas20SecurityDefinitionConverter);

		var _this = _possibleConstructorReturn(this, (Oas20SecurityDefinitionConverter.__proto__ || Object.getPrototypeOf(Oas20SecurityDefinitionConverter)).call(this, model));

		_this.dereferencedAPI = dereferencedAPI;
		return _this;
	}

	_createClass(Oas20SecurityDefinitionConverter, [{
		key: 'export',
		value: function _export(models) {
			var result = {};
			if (_.isEmpty(models)) return result;

			for (var i = 0; i < models.length; i++) {
				var model = models[i];
				var swaggerDef = this._export(model);
				if (swaggerDef != null) {
					result[model.schemaName] = swaggerDef;
				}
			}

			return result;
		}
	}, {
		key: 'import',
		value: function _import(oasDefs) {
			var result = [];
			if (_.isEmpty(oasDefs)) return result;

			if (oasHelper.isFilePath(oasDefs) && this.dereferencedAPI) {
				oasDefs = this.dereferencedAPI;
			}

			for (var id in oasDefs) {
				if (!oasDefs.hasOwnProperty(id)) continue;
				var oasDef = oasDefs[id];
				oasDef.schemaName = id;
				var securityDefinition = this._import(oasDef);
				result.push(securityDefinition);
			}

			return result;
		}
	}, {
		key: '_export',
		value: function _export(model) {
			var attrIdMap = {};
			var attrIdSkip = ['type', 'schemaName', 'authorization', 'scopes', 'signatures', 'displayName', 'describedBy', 'requestTokenUri', 'tokenUrl', 'authorizationUrl', 'name', '_in'];
			var oasValidSecurityTypes = ['oauth2', 'basic', 'apiKey'];
			var oasDef = Oas20SecurityDefinitionConverter.createOasDef(model, attrIdMap, attrIdSkip);

			var type = model.type;
			if (oasValidSecurityTypes.indexOf(type) > -1) {
				oasDef.type = type;
			} else if (type.substr(0, 2) === 'x-') {
				oasDef.type = 'apiKey';
			} else {
				return;
			}

			switch (oasDef.type) {
				case 'oauth2':
					{
						var authorizationUrlValidFlows = ['implicit', 'accessCode'];
						var tokenUrlValidFlows = ['application', 'password', 'accessCode'];
						if (model.hasOwnProperty('authorization') && model.authorization) oasDef.flow = model.authorization[0];
						if (_.includes(authorizationUrlValidFlows, oasDef.flow)) oasDef.authorizationUrl = model.authorizationUrl;
						if (_.includes(tokenUrlValidFlows, oasDef.flow)) oasDef.tokenUrl = model.tokenUrl;
						oasDef.scopes = {};
						if (model.hasOwnProperty('scopes') && model.scopes) {
							var scopes = model.scopes;
							for (var i = 0; i < scopes.length; i++) {
								var scope = scopes[i];
								oasDef.scopes[scope.value] = scope.description;
							}
						}
						break;
					}

				case 'apiKey':
					{
						var describedBy = model.describedBy;
						if (!describedBy) {
							oasDef.in = 'header';
							oasDef.name = model.schemaName;
						} else if (describedBy.hasOwnProperty('headers') && !_.isEmpty(describedBy.headers) && describedBy.headers != null) {
							oasDef.in = 'header';
							oasDef.name = describedBy.headers[0].name;
						} else if (describedBy.hasOwnProperty('parameters') && !_.isEmpty(describedBy.parameters) && describedBy.parameters != null) {
							oasDef.in = 'query';
							oasDef.name = describedBy.parameters[0].name;
						}
						break;
					}
			}

			return oasDef;
		}
	}, {
		key: '_import',
		value: function _import(oasDef) {
			var attrIdMap = {};
			var attrIdSkip = ['flow', 'scopes', 'in', 'name'];
			var model = Oas20SecurityDefinitionConverter.createSecurityDefinition(oasDef, attrIdMap, attrIdSkip, oasHelper.getAnnotationPrefix);

			if (oasDef.hasOwnProperty('flow')) {
				var authorization = [oasDef.flow];
				model.authorization = authorization;
			}
			if (oasDef.hasOwnProperty('scopes')) {
				var scopes = [];
				for (var id in oasDef.scopes) {
					if (!oasDef.scopes.hasOwnProperty(id)) continue;
					var scope = new SecurityScope();
					scope.value = id;
					scope.description = oasDef.scopes[id];
					scopes.push(scope);
				}
				model.scopes = scopes;
			}

			if (oasDef.in && oasDef.name) {
				var describedBy = {};
				if (oasDef.in === 'header') {
					describedBy.headers = {};
					describedBy.headers[oasDef.name] = { type: ['string'], name: oasDef.name };
				} else if (oasDef.in === 'query') {
					describedBy.queryParameters = {};
					describedBy.queryParameters[oasDef.name] = { type: ['string'], name: oasDef.name };
				}
				var ramlMethodConverter = new RamlMethodConverter();
				var describedByModel = ramlMethodConverter._import(describedBy);
				model.describedBy = describedByModel;
			}

			Oas20RootConverter.importAnnotations(oasDef, model, this.model);

			return model;
		}
	}], [{
		key: 'createOasDef',
		value: function createOasDef(securityDefinition, attrIdMap, attrIdSkip) {
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
		value: function createSecurityDefinition(model, attrIdMap, attrIdSkip, annotationPrefix) {
			var object = {};

			_.assign(object, model);
			attrIdSkip.map(function (id) {
				delete object[id];
			});
			_.keys(attrIdMap).map(function (id) {
				object[attrIdMap[id]] = object[id];
				delete object[id];
			});
			for (var id in object) {
				if (!object.hasOwnProperty(id)) continue;

				if (id.startsWith(annotationPrefix) || id.startsWith('x-')) delete object[id];
			}

			var result = new SecurityDefinition();
			_.assign(result, object);

			return result;
		}
	}]);

	return Oas20SecurityDefinitionConverter;
}(Converter);

module.exports = Oas20SecurityDefinitionConverter;