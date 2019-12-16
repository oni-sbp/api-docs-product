'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ = require('lodash');

var ConverterModel = require('oas-raml-converter-model');
var Converter = require('../converters/converter');
var SecurityDefinition = ConverterModel.SecurityDefinition;
var SecurityScope = ConverterModel.SecurityScope;
var Method = ConverterModel.Method;

var _require = require('./oas30Types'),
    OAuthFlows = _require.OAuthFlows,
    OAuthFlow = _require.OAuthFlow;

var Oas30SecurityDefinitionConverter = function (_Converter) {
	_inherits(Oas30SecurityDefinitionConverter, _Converter);

	function Oas30SecurityDefinitionConverter() {
		_classCallCheck(this, Oas30SecurityDefinitionConverter);

		return _possibleConstructorReturn(this, (Oas30SecurityDefinitionConverter.__proto__ || Object.getPrototypeOf(Oas30SecurityDefinitionConverter)).apply(this, arguments));
	}

	_createClass(Oas30SecurityDefinitionConverter, [{
		key: 'export',
		value: function _export(models) {
			var result = {};
			if (_.isEmpty(models)) return result;

			for (var i = 0; i < models.length; i++) {
				var model = models[i];
				var oasDef = this._export(model);
				if (oasDef != null) {
					result[model.schemaName] = oasDef;
				}
			}

			return result;
		}
	}, {
		key: '_export',
		value: function _export(model) {
			var attrIdMap = {};
			var attrIdSkip = ['type', 'schemaName', 'authorization', 'scopes', 'signatures', 'displayName', 'describedBy', 'requestTokenUri', 'tokenUrl', 'authorizationUrl', 'name', '_in'];
			var oasValidSecurityTypes = ['oauth2', 'basic', 'apiKey'];
			var oasDef = Oas30SecurityDefinitionConverter.createOasDef(model, attrIdMap, attrIdSkip);

			var type = model.type;
			if (oasValidSecurityTypes.indexOf(type) !== -1) {
				oasDef.type = type;
			} else if (type.substr(0, 2) === 'x-') {
				oasDef.type = 'apiKey';
			} else {
				return;
			}

			switch (oasDef.type) {
				case 'basic':
					{
						oasDef.scheme = 'basic';
						oasDef.type = 'http';
						break;
					}

				case 'oauth2':
					{
						oasDef.flows = new OAuthFlows();

						if (model == null || model.authorization == null || model.authorization[0] == null) break;

						var validFlows = {
							'implicit': 'implicit',
							'password': 'password',
							'application': 'clientCredentials',
							'accessCode': 'authorizationCode'
						};
						var authorizationUrlValidFlows = ['implicit', 'authorizationCode'];
						var tokenUrlValidFlows = ['clientCredentials', 'password', 'authorizationCode'];

						// $ExpectError flow is stupid ..
						var flowType = validFlows[model.authorization[0]];
						var flow = new OAuthFlow();

						if (_.includes(authorizationUrlValidFlows, flowType)) {
							flow.authorizationUrl = model.authorizationUrl;
						}
						if (_.includes(tokenUrlValidFlows, flowType)) {
							flow.tokenUrl = model.tokenUrl;
						}

						flow.scopes = {};
						if (model.scopes != null) {
							var scopes = model.scopes;
							for (var i = 0; i < scopes.length; i++) {
								var scope = scopes[i];
								flow.scopes[scope.value] = scope.description;
							}
						}

						// $ExpectError flow is stupid ..
						oasDef.flows[flowType] = flow;

						break;
					}

				case 'apiKey':
					{
						var describedBy = model.describedBy;
						if (describedBy == null) {
							oasDef.in = 'header';
							oasDef.name = model.schemaName;
						} else if (describedBy.headers != null && !_.isEmpty(describedBy.headers) && describedBy.headers != null) {
							oasDef.in = 'header';
							oasDef.name = describedBy.headers[0].name;
						} else if (describedBy.parameters != null && !_.isEmpty(describedBy.parameters) && describedBy.parameters != null) {
							oasDef.in = 'query';
							oasDef.name = describedBy.parameters[0].name;
						}
						break;
					}
			}

			return oasDef;
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
	}]);

	return Oas30SecurityDefinitionConverter;
}(Converter);

module.exports = Oas30SecurityDefinitionConverter;