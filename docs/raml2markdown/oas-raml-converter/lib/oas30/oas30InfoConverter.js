'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Converter = require('../converters/converter');
var ConverterModel = require('oas-raml-converter-model');
var Oas20AnnotationConverter = require('../oas20/oas20AnnotationConverter');
var Info = ConverterModel.Info;
var _ = require('lodash');

var _require = require('./oas30Types'),
    Contact = _require.Contact,
    License = _require.License;

var OasInfo = require('./oas30Types').Info;

var Oas30InfoConverter = function (_Converter) {
	_inherits(Oas30InfoConverter, _Converter);

	function Oas30InfoConverter() {
		_classCallCheck(this, Oas30InfoConverter);

		return _possibleConstructorReturn(this, (Oas30InfoConverter.__proto__ || Object.getPrototypeOf(Oas30InfoConverter)).apply(this, arguments));
	}

	_createClass(Oas30InfoConverter, [{
		key: 'export',
		value: function _export(model) {
			if (_.isEmpty(model)) return new OasInfo();

			var info = new OasInfo(model.title, String(model.version));

			info.description = model.description;
			info.termsOfService = model.termsOfService;

			if (model.contact != null) {
				var contact = new Contact();
				contact.name = model.contact.name;
				contact.url = model.contact.url;
				contact.email = model.contact.email;
				info.contact = contact;
			}

			if (model.license != null) {
				var license = new License(model.license.name || '');
				license.url = model.license.url;
				info.license = license;
			}

			if (model.annotations != null) {
				var annotationConverter = new Oas20AnnotationConverter();
				_.assign(info, annotationConverter._export(model));
			}

			return info;
		}
	}]);

	return Oas30InfoConverter;
}(Converter);

module.exports = Oas30InfoConverter;