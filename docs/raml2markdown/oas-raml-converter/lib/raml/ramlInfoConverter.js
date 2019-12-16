'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ = require('lodash');
var ConverterModel = require('oas-raml-converter-model');
var Info = ConverterModel.Info;
var InfoData = ConverterModel.InfoData;
var Converter = require('../converters/converter');
var ramlHelper = require('../helpers/raml');
var RamlAnnotationConverter = require('../raml/ramlAnnotationConverter');
var RamlCustomAnnotationConverter = require('../raml/ramlCustomAnnotationConverter');

var RamlInfoConverter = function (_Converter) {
	_inherits(RamlInfoConverter, _Converter);

	function RamlInfoConverter() {
		_classCallCheck(this, RamlInfoConverter);

		return _possibleConstructorReturn(this, (RamlInfoConverter.__proto__ || Object.getPrototypeOf(RamlInfoConverter)).apply(this, arguments));
	}

	_createClass(RamlInfoConverter, [{
		key: 'export',
		value: function _export(model) {
			return _.isEmpty(model) ? {} : this._export(model);
		}
	}, {
		key: 'import',
		value: function _import(ramlDef) {
			return _.isEmpty(ramlDef) ? {} : this._import(ramlDef);
		}
	}, {
		key: '_export',
		value: function _export(model) {
			var attrIdMap = {};
			var attrIdSkip = ['description', 'contact', 'license', 'termsOfService', 'version', 'annotations'];
			var ramlDef = RamlInfoConverter.createRamlDef(model, attrIdMap, attrIdSkip);

			if (model.hasOwnProperty('description') && !_.isEmpty(model.description)) ramlDef.description = model.description;

			if (model.hasOwnProperty('version') && model.version !== '') {
				var intVersion = parseInt(model.version);
				ramlDef.version = model.version === intVersion.toString() ? intVersion : model.version;
			}

			var oasInfo = {};
			if (model.hasOwnProperty('termsOfService')) oasInfo.termsOfService = model.termsOfService;

			if (model.hasOwnProperty('contact') && model.contact != null) {
				var contact = {};
				var contactModel = model.contact;
				if (contactModel.hasOwnProperty('name')) contact.name = contactModel.name;
				if (contactModel.hasOwnProperty('url')) contact.url = contactModel.url;
				if (contactModel.hasOwnProperty('email')) contact.email = contactModel.email;
				if (contactModel.hasOwnProperty('annotations') && _.isArray(contactModel.annotations) && !_.isEmpty(contactModel.annotations)) {
					var annotationConverter = new RamlAnnotationConverter(this.model, this.annotationPrefix, this.def);
					_.assign(contact, annotationConverter._export(contactModel));
				}
				if (!_.isEmpty(contact)) oasInfo.contact = contact;
			}

			if (model.hasOwnProperty('license') && model.license != null) {
				var license = {};
				var licenseModel = model.license;
				if (licenseModel.hasOwnProperty('name')) license.name = licenseModel.name;
				if (licenseModel.hasOwnProperty('url')) license.url = licenseModel.url;
				if (licenseModel.hasOwnProperty('annotations') && _.isArray(licenseModel.annotations) && !_.isEmpty(licenseModel.annotations)) {
					var _annotationConverter = new RamlAnnotationConverter(this.model, this.annotationPrefix, this.def);
					_.assign(license, _annotationConverter._export(licenseModel));
				}
				if (!_.isEmpty(license)) oasInfo.license = license;
			}

			if (model.hasOwnProperty('annotations') && _.isArray(model.annotations) && !_.isEmpty(model.annotations)) {
				var _annotationConverter2 = new RamlAnnotationConverter(this.model, this.annotationPrefix, this.def);
				_.assign(oasInfo, _annotationConverter2._export(model));
			}

			if (!_.isEmpty(oasInfo)) {
				var id = this.annotationPrefix + '-info';
				var annotationId = '(' + id + ')';
				ramlDef[annotationId] = oasInfo;
				if (!this.model.annotationTypes || !this.model.annotationTypes.hasOwnProperty('oas-info')) RamlCustomAnnotationConverter._createAnnotationType(ramlDef, this.annotationPrefix, id);
			}

			return ramlDef;
		}
	}, {
		key: '_import',
		value: function _import(ramlDef) {
			var model = new Info();

			if (ramlDef.hasOwnProperty('title')) model.title = ramlDef.title;
			if (ramlDef.hasOwnProperty('description')) model.description = ramlDef.description;
			if (ramlDef.hasOwnProperty('version')) model.version = ramlDef.version;

			if (ramlHelper.isRaml08Version(this.version) && ramlDef.hasOwnProperty('documentation') && !_.isEmpty(ramlDef.documentation) && !model.description) {
				var documentation = ramlDef.documentation[0];
				if (documentation.hasOwnProperty('content') && !_.isEmpty(documentation.content)) model.description = documentation.content;
			}

			if (ramlDef.hasOwnProperty('annotations')) {
				var annotations = ramlDef.annotations;
				if (annotations.hasOwnProperty('oas-info')) {
					var oasInfo = annotations['oas-info'].structuredValue;
					if (oasInfo.hasOwnProperty('termsOfService')) {
						model.termsOfService = oasInfo.termsOfService;
						delete oasInfo.termsOfService;
					}
					if (oasInfo.hasOwnProperty('contact')) {
						var contact = new InfoData();
						_.assign(contact, oasInfo.contact);
						if (!_.isEmpty(contact)) model.contact = contact;
						delete oasInfo.contact;
					}
					if (oasInfo.hasOwnProperty('license')) {
						var license = new InfoData();
						_.assign(license, oasInfo.license);
						if (!_.isEmpty(license)) model.license = license;
						delete oasInfo.license;
					}

					RamlAnnotationConverter.importAnnotations({ annotations: oasInfo }, model, this.model);
				}
			}

			return model;
		}
	}], [{
		key: 'createRamlDef',
		value: function createRamlDef(info, attrIdMap, attrIdSkip) {
			var result = {};

			_.assign(result, info);
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

	return RamlInfoConverter;
}(Converter);

module.exports = RamlInfoConverter;