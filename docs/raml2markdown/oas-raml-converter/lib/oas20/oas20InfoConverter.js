'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ConverterModel = require('oas-raml-converter-model');
var Converter = require('../converters/converter');
var Oas20AnnotationConverter = require('../oas20/oas20AnnotationConverter');
var Info = ConverterModel.Info;
var InfoData = ConverterModel.InfoData;
var Annotation = ConverterModel.Annotation;
var _ = require('lodash');
var oasHelper = require('../helpers/oas20');

var Oas20InfoConverter = function (_Converter) {
	_inherits(Oas20InfoConverter, _Converter);

	function Oas20InfoConverter() {
		_classCallCheck(this, Oas20InfoConverter);

		return _possibleConstructorReturn(this, (Oas20InfoConverter.__proto__ || Object.getPrototypeOf(Oas20InfoConverter)).apply(this, arguments));
	}

	_createClass(Oas20InfoConverter, [{
		key: 'export',
		value: function _export(model) {
			return _.isEmpty(model) ? {} : this._export(model);
		}
	}, {
		key: 'import',
		value: function _import(oasDef) {
			return _.isEmpty(oasDef) ? {} : this._import(oasDef);
		}
	}, {
		key: '_export',
		value: function _export(model) {
			var attrIdMap = {};

			var attrIdSkip = ['version', 'contactName', 'contactUrl', 'contactEmail', 'licenseName', 'licenseUrl', 'annotations'];
			var annotationPrefix = oasHelper.getAnnotationPrefix;
			var annotationConverter = new Oas20AnnotationConverter();
			var oasDef = Oas20InfoConverter.createOasDef(model, attrIdMap, attrIdSkip, annotationPrefix);

			oasDef.version = model.hasOwnProperty('version') && model.version ? model.version.toString() : '';

			if (model.hasOwnProperty('contact') && model.contact != null) {
				var contact = {};
				var contactModel = model.contact;
				if (contactModel.hasOwnProperty('name')) contact.name = contactModel.name;
				if (contactModel.hasOwnProperty('url')) contact.url = contactModel.url;
				if (contactModel.hasOwnProperty('email')) contact.email = contactModel.email;

				if (!_.isEmpty(contact)) oasDef.contact = contact;
			}

			if (model.hasOwnProperty('license') && model.license != null) {
				var license = {};
				var licenseModel = model.license;
				if (licenseModel.hasOwnProperty('name')) license.name = licenseModel.name;
				if (licenseModel.hasOwnProperty('url')) license.url = licenseModel.url;

				if (!_.isEmpty(license)) oasDef.license = license;
			}

			if (model.hasOwnProperty('annotations')) {
				_.assign(oasDef, annotationConverter._export(model));
			}

			return oasDef;
		}
	}, {
		key: '_import',
		value: function _import(oasDef) {
			var attrIdMap = {};
			var attrIdSkip = ['contact', 'license'];
			var model = Oas20InfoConverter.createInfo(oasDef, attrIdMap, attrIdSkip);
			var annotationConverter = new Oas20AnnotationConverter(this.model);

			if (oasDef.hasOwnProperty('contact')) {
				var contact = new InfoData();
				_.assign(contact, oasDef.contact);
				var _annotations = annotationConverter._import(oasDef.contact);
				if (!_.isEmpty(_annotations)) contact.annotations = _annotations;
				if (!_.isEmpty(contact)) model.contact = contact;
			}

			if (oasDef.hasOwnProperty('license')) {
				var license = new InfoData();
				_.assign(license, oasDef.license);
				var _annotations2 = annotationConverter._import(oasDef.license);
				if (!_.isEmpty(_annotations2)) license.annotations = _annotations2;
				if (!_.isEmpty(license)) model.license = license;
			}

			var annotations = annotationConverter._import(oasDef);
			if (!_.isEmpty(annotations)) model.annotations = annotations;

			return model;
		}
	}], [{
		key: 'createOasDef',
		value: function createOasDef(info, attrIdMap, attrIdSkip, annotationPrefix) {
			var result = {};

			_.assign(result, info);
			attrIdSkip.map(function (id) {
				delete result[id];
			});
			_.keys(attrIdMap).map(function (id) {
				result[attrIdMap[id]] = result[id];
				delete result[id];
			});
			for (var id in result) {
				if (!info.hasOwnProperty(id)) continue;
				if (id.startsWith(annotationPrefix) || id.startsWith('x-')) {
					delete result[id];
				}
			}

			return result;
		}
	}, {
		key: 'createInfo',
		value: function createInfo(oasDef, attrIdMap, attrIdSkip) {
			var object = {};

			_.entries(oasDef).map(function (_ref) {
				var _ref2 = _slicedToArray(_ref, 2),
				    key = _ref2[0],
				    value = _ref2[1];

				if (attrIdSkip.indexOf(key) < 0 && !key.startsWith('x-')) {
					object[attrIdMap.hasOwnProperty(key) ? attrIdMap[key] : key] = value;
				}
			});
			var result = new Info();
			_.assign(result, object);

			return result;
		}
	}]);

	return Oas20InfoConverter;
}(Converter);

module.exports = Oas20InfoConverter;