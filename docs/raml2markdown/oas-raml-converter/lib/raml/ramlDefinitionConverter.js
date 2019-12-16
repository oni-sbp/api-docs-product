'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ = require('lodash');
var ConverterModel = require('oas-raml-converter-model');
var Definition = ConverterModel.Definition;
var Root = ConverterModel.Root;
var Annotation = ConverterModel.Annotation;
var Converter = require('../converters/converter');
var helper = require('../helpers/converter');
var jsonHelper = require('../utils/json');
var arrayHelper = require('../utils/array');
var ramlHelper = require('../helpers/raml');
var stringHelper = require('../utils/strings');
var xmlHelper = require('../utils/xml');
var RamlAnnotationConverter = require('../raml/ramlAnnotationConverter');
var RamlCustomAnnotationConverter = require('../raml/ramlCustomAnnotationConverter');

var RamlDefinitionConverter = function (_Converter) {
	_inherits(RamlDefinitionConverter, _Converter);

	function RamlDefinitionConverter() {
		_classCallCheck(this, RamlDefinitionConverter);

		return _possibleConstructorReturn(this, (RamlDefinitionConverter.__proto__ || Object.getPrototypeOf(RamlDefinitionConverter)).apply(this, arguments));
	}

	_createClass(RamlDefinitionConverter, [{
		key: 'export',
		value: function _export(models) {
			var result = {};
			this.level = 'type';

			for (var i = 0; i < models.length; i++) {
				var model = models[i];
				var modelName = model.name;
				var name = stringHelper.checkAndReplaceInvalidChars(modelName, ramlHelper.getValidCharacters, ramlHelper.getReplacementCharacter);
				result[name] = this._export(model);
				if (modelName !== name) {
					var annotationName = this.annotationPrefix + '-definition-name';
					RamlCustomAnnotationConverter._createAnnotationType(this.def, this.annotationPrefix, annotationName);
					result[name]['(' + annotationName + ')'] = modelName;
				}
			}

			return result;
		}
	}, {
		key: '_export',
		value: function _export(model) {
			if (model.hasOwnProperty('jsonValue')) {
				return model.jsonValue;
			}

			var attrIdMap = {
				'_enum': 'enum',
				'_default': 'default'
			};

			var attrIdSkip = ['name', 'type', 'reference', 'properties', 'items', 'compositionType', 'oneOf', 'in', 'schema', 'additionalProperties', 'title', 'items', 'itemsList', 'exclusiveMaximum', 'exclusiveMinimum', 'readOnly', 'externalDocs', '$schema', 'annotations', 'collectionFormat', 'allowEmptyValue', 'fileReference', '_enum', 'error', 'warning', 'includePath', 'expanded'];

			var ramlDef = RamlDefinitionConverter.createRamlDef(model, attrIdMap, attrIdSkip);

			if (model.hasOwnProperty('type')) {
				if (_typeof(model.type) === 'object' && model.type) {
					var type = model.type;
					ramlDef.type = _.isArray(type) ? type : this._export(type);
				} else {
					ramlDef.type = model.type;
					if (model.hasOwnProperty('format')) {
						var id = this.annotationPrefix + '-format';
						RamlCustomAnnotationConverter._createAnnotationType(this.def, this.annotationPrefix, id);
						ramlDef['(' + id + ')'] = model.format;
						delete ramlDef.format;
					}
				}
			}

			if (model.hasOwnProperty('fileReference') && model.fileReference) {
				ramlDef.type = '!include ' + model.fileReference.replace('#/', '#');
			}

			if (ramlDef.hasOwnProperty('internalType')) {
				this._convertFromInternalType(ramlDef);
			}

			if (ramlDef.type !== 'string' && ramlDef.type !== 'file' && !model.reference) {
				if (ramlDef.hasOwnProperty('minLength')) delete ramlDef.minLength;
				if (ramlDef.hasOwnProperty('maxLength')) delete ramlDef.maxLength;
			}

			if (model.hasOwnProperty('items') && model.items != null) {
				var itemsModel = model.items;
				var items = this._export(itemsModel);
				if (items && (typeof items === 'undefined' ? 'undefined' : _typeof(items)) === 'object' && items.hasOwnProperty('format') && items.format === 'string') {
					items.type = items.format;
					delete items.format;
				}
				if (ramlDef.type !== 'array') ramlDef.type = 'array';
				if (ramlDef.hasOwnProperty('enum')) delete ramlDef.enum;
				ramlDef.items = items;
			}

			if (model.hasOwnProperty('itemsList') && model.itemsList != null) {
				var itemsList = model.itemsList;
				var _items = [];
				for (var i = 0; i < itemsList.length; i++) {
					var def = itemsList[i];
					_items.push(this._export(def));
				}
				ramlDef.items = _items;
			}

			if (model.hasOwnProperty('reference') && model.reference != null) {
				var val = model.reference;
				if (_.isArray(val)) {
					ramlDef.type = val;
				} else {
					if ((typeof val === 'undefined' ? 'undefined' : _typeof(val)) === 'object') {
						ramlDef.type = val;
					} else {
						ramlDef.type = val;
					}
				}
				ramlDef.type = stringHelper.checkAndReplaceInvalidChars(model.reference, ramlHelper.getValidCharacters, ramlHelper.getReplacementCharacter);
			}

			if (model.hasOwnProperty('_enum') && model._enum != null) {
				var enumModel = model._enum;
				var isString = ramlDef.type === 'string';
				var isNumeric = ramlDef.type === 'integer' || ramlDef.type === 'number';
				var isDateOnly = ramlDef.type === 'date-only';
				var _enum = [];
				for (var _i = 0; _i < enumModel.length; _i++) {
					var item = enumModel[_i];
					if (isString) item = item.toString();else if (isNumeric) item = Number(item);else if (isDateOnly) item = item.replace('_', '-').replace('_', '-');
					_enum.push(item);
				}
				ramlDef.enum = _enum;
			}

			if (model.hasOwnProperty('properties') && model.properties != null) {
				var properties = model.properties;
				var ramlProps = {};
				for (var _i2 = 0; _i2 < properties.length; _i2++) {
					var value = properties[_i2];
					var name = value.name;
					ramlProps[name] = this._export(value);

					if (!model.hasOwnProperty('propsRequired')) {
						ramlProps[name].required = false;
					} else if (model.hasOwnProperty('propsRequired') && model.propsRequired != null) {
						var propsRequired = model.propsRequired;
						if (_.isEmpty(propsRequired) || propsRequired.indexOf(name) < 0) ramlProps[name].required = false;
					}
				}

				if (!_.isEmpty(ramlProps)) ramlDef.properties = ramlProps;
				delete ramlDef.propsRequired;
			}

			if (model.hasOwnProperty('compositionType') && model.compositionType != null) {
				var result = {};
				for (var _i3 = 0; _i3 < model.compositionType.length; _i3++) {
					var _value = model.compositionType[_i3];
					var _val = this._export(_value);
					if (_val && (typeof _val === 'undefined' ? 'undefined' : _typeof(_val)) === 'object') {
						if (_val.hasOwnProperty('properties')) {
							delete _val.type;
							_.merge(result, _val);
						} else if (result.hasOwnProperty('type') && _val.hasOwnProperty('type')) {
							var _type = result.type;
							if (typeof _type === 'string') result.type = [result.type, _val.type];else if (_.isArray(_type)) result.type = result.type.concat(_val.type);
							delete _val.type;
							_.merge(result, _val);
						} else {
							_.assign(result, _val);
						}
					}
				}

				_.assign(ramlDef, result);
				delete ramlDef.compositionType;
			}

			if (model.hasOwnProperty('oneOf')) {
				var _result = '';
				for (var _i4 = 0; _i4 < model.oneOf.length; _i4++) {
					if (_result.length > 0) _result = _result.concat(' | ');
					var _value2 = model.oneOf[_i4];
					var _val2 = this._export(_value2);
					_result = _result.concat(_val2.type);
				}

				ramlDef.type = _result;
			}

			if (model.hasOwnProperty('schema') && model.schema != null) {
				var schema = model.schema;
				ramlDef.schema = this._export(schema);
			}

			if (model.hasOwnProperty('additionalProperties') && model.additionalProperties != null) {
				if (_typeof(model.additionalProperties) === 'object') {
					var additionalProperties = model.additionalProperties;
					if (!ramlDef.hasOwnProperty('properties')) {
						ramlDef.properties = {};
					}
					ramlDef.properties['//'] = this._export(additionalProperties);
					delete ramlDef.additionalProperties;
				} else {
					ramlDef.additionalProperties = model.additionalProperties;
				}
			}

			if (model.hasOwnProperty('example')) {
				if (model.hasOwnProperty('type') && scalarNumberTypes.indexOf(model.type) >= 0) {
					ramlDef['example'] = _.toNumber(model.example);
				} else {
					var example = jsonHelper.parse(model.example);
					if ((typeof example === 'undefined' ? 'undefined' : _typeof(example)) === 'object' && !_.isArray(example)) {
						ramlDef['example'] = RamlDefinitionConverter.exportExample(example, this.model, this.def);
						if (this.level === 'type' && !ramlDef.hasOwnProperty('type') && !ramlDef.hasOwnProperty('properties')) ramlDef.type = 'object';
					} else {
						if (_.isNumber(example) && ramlDef.type === 'string') example = example.toString();
						ramlDef['example'] = example;
					}
				}
			}

			if (model.hasOwnProperty('exclusiveMaximum')) {
				var _id = this.annotationPrefix + '-exclusiveMaximum';
				RamlCustomAnnotationConverter._createAnnotationType(this.def, this.annotationPrefix, _id);
				ramlDef['(' + _id + ')'] = model.exclusiveMaximum;
			}
			if (model.hasOwnProperty('exclusiveMinimum')) {
				var _id2 = this.annotationPrefix + '-exclusiveMinimum';
				RamlCustomAnnotationConverter._createAnnotationType(this.def, this.annotationPrefix, _id2);
				ramlDef['(' + _id2 + ')'] = model.exclusiveMinimum;
			}
			if (model.hasOwnProperty('title')) {
				var _id3 = this.annotationPrefix + '-schema-title';
				RamlCustomAnnotationConverter._createAnnotationType(this.def, this.annotationPrefix, _id3);
				ramlDef['(' + _id3 + ')'] = model.title;
			}
			if (model.hasOwnProperty('readOnly')) {
				var _id4 = this.annotationPrefix + '-readOnly';
				RamlCustomAnnotationConverter._createAnnotationType(this.def, this.annotationPrefix, _id4);
				ramlDef['(' + _id4 + ')'] = model.readOnly;
			}
			if (model.hasOwnProperty('collectionFormat')) {
				var _id5 = this.annotationPrefix + '-collectionFormat';
				RamlCustomAnnotationConverter._createAnnotationType(this.def, this.annotationPrefix, _id5);
				ramlDef['(' + _id5 + ')'] = model.collectionFormat;
			}
			if (model.hasOwnProperty('allowEmptyValue')) {
				var _id6 = this.annotationPrefix + '-allowEmptyValue';
				RamlCustomAnnotationConverter._createAnnotationType(this.def, this.annotationPrefix, _id6);
				ramlDef['(' + _id6 + ')'] = model.allowEmptyValue;
			}
			if (model.hasOwnProperty('externalDocs')) {
				var _id7 = this.annotationPrefix + '-externalDocs';
				RamlCustomAnnotationConverter._createAnnotationType(this.def, this.annotationPrefix, _id7);
				ramlDef['(' + _id7 + ')'] = model.externalDocs;
			}
			if (ramlDef.hasOwnProperty('maximum') && ramlDef.maximum && ramlDef.hasOwnProperty('type') && scalarNumberTypes.indexOf(ramlDef.type) < 0 && !model.reference) {
				var _id8 = this.annotationPrefix + '-maximum';
				RamlCustomAnnotationConverter._createAnnotationType(this.def, this.annotationPrefix, _id8);
				ramlDef['(' + _id8 + ')'] = ramlDef.maximum;
				delete ramlDef.maximum;
			}
			if (ramlDef.hasOwnProperty('minimum') && ramlDef.minimum && ramlDef.hasOwnProperty('type') && scalarNumberTypes.indexOf(ramlDef.type) < 0 && !model.reference) {
				var _id9 = this.annotationPrefix + '-minimum';
				RamlCustomAnnotationConverter._createAnnotationType(this.def, this.annotationPrefix, _id9);
				ramlDef['(' + _id9 + ')'] = ramlDef.minimum;
				delete ramlDef.minimum;
			}
			if (model.hasOwnProperty('annotations') && _.isArray(model.annotations) && !_.isEmpty(model.annotations)) {
				var annotationConverter = new RamlAnnotationConverter(this.model, this.annotationPrefix, this.def);
				_.assign(ramlDef, annotationConverter._export(model));
			}

			return ramlDef;
		}
	}, {
		key: 'import',
		value: function _import(ramlDefs) {
			var result = [];
			if (_.isEmpty(ramlDefs)) return result;
			if (ramlHelper.isRaml08Version(this.version)) return this.importRAML08(ramlDefs);

			helper.removePropertiesFromObject(ramlDefs, ['fixedFacets']);

			for (var index in ramlDefs) {
				if (!ramlDefs.hasOwnProperty(index)) continue;
				var entry = ramlDefs[index];

				for (var key in entry) {
					if (!entry.hasOwnProperty(key)) continue;
					var value = entry[key];
					if (value.hasOwnProperty('typePropertyKind') && value.typePropertyKind === 'JSON') {
						var schema = value.schema && _.isArray(value.schema) ? value.schema : value.type;
						var jsonValue = RamlDefinitionConverter._readTypeAttribute(schema);
						var parse = jsonHelper.parse(jsonValue);
						if (parse && parse.hasOwnProperty('definitions')) {
							var definitions = this.import(RamlDefinitionConverter._convertMapToArray(parse.definitions));
							result = result.concat(definitions);
							delete parse.definitions;
							value.type[0] = jsonHelper.stringify(parse);
						}
						var definition = this._import(parse);
						definition.name = key;
						definition.jsonValue = jsonValue;
						result.push(definition);
					} else {
						var _definition = this._import(value);
						_definition.name = key;
						result.push(_definition);
					}
				}
			}

			return result;
		}
	}, {
		key: 'importRAML08',
		value: function importRAML08(ramlDefs) {
			var result = [];
			if (_.isEmpty(ramlDefs)) return result;

			if (_.isArray(ramlDefs) && !_.isEmpty(ramlDefs)) {
				for (var id in ramlDefs) {
					if (!ramlDefs.hasOwnProperty(id)) continue;

					var value = ramlDefs[id];
					var name = _.keys(value)[0];
					if (this.types && this.types.includes(name)) continue;
					var schema = helper.isJson(value[name]) ? JSON.parse(value[name]) : value[name];
					if (schema.hasOwnProperty('definitions')) {
						var definitions = this.importRAML08(RamlDefinitionConverter._convertMapToArray(schema.definitions));
						result = result.concat(definitions);
						delete schema.definitions;
					}
					if (xmlHelper.isXml(schema)) schema = { type: schema };
					var definition = this._import(schema);
					definition.name = name;
					result.push(definition);
				}
			}
			var typeNames = result.map(function (type) {
				return type.name;
			});
			this.types = this.types ? this.types.concat(typeNames) : typeNames;

			return result;
		}
	}, {
		key: '_import',
		value: function _import(ramlDef) {
			var _this2 = this;

			var attrIdMap = {
				'default': '_default'
			};

			RamlDefinitionConverter._convertAnnotations(ramlDef);

			var attrIdCopyRaml = ['title', 'format', 'maxLength', 'minLength', 'exclusiveMaximum', 'exclusiveMinimum', 'maximum', 'minimum', 'definitions', 'minProperties', 'maxProperties', 'minItems', 'maxItems', 'default', 'uniqueItems', 'fileTypes'];
			var attrIdCopyRaml10 = _.concat(attrIdCopyRaml, ['name', 'discriminator', 'multipleOf', 'pattern', 'displayName', 'default', 'schemaPath', 'required', 'xml', 'additionalProperties', 'minItems', 'maxItems', 'annotations', 'allowedTargets', '$ref', 'minProperties', 'maxProperties']);
			var attrIdCopyRaml08 = _.concat(attrIdCopyRaml, ['pattern', 'additionalProperties']);
			var jsonType = ramlDef.hasOwnProperty('typePropertyKind') ? ramlDef.typePropertyKind === 'JSON' : false;
			var inplaceType = ramlDef.hasOwnProperty('typePropertyKind') ? ramlDef.typePropertyKind === 'INPLACE' : ramlDef.hasOwnProperty('type') && _typeof(ramlDef.type) === 'object' && !_.isArray(ramlDef.type);
			var isRaml08Version = ramlHelper.isRaml08Version(this.version);

			if (isRaml08Version && typeof ramlDef === 'string') ramlDef = { type: ramlDef };

			if (inplaceType) {
				var value = void 0;
				if (ramlDef.hasOwnProperty('type')) {
					value = jsonHelper.parse(RamlDefinitionConverter._readTypeAttribute(ramlDef.type));
					if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') {
						if (isRaml08Version) {
							_.assign(ramlDef, value);
							delete ramlDef.type;
						} else {
							delete ramlDef.type;
							_.merge(ramlDef, value);
						}
					}
				} else if (ramlDef.hasOwnProperty('schema')) {
					value = RamlDefinitionConverter._readTypeAttribute(ramlDef.schema);
					_.assign(ramlDef, jsonHelper.parse(value));
					delete ramlDef.schema;
				}
			}

			var model = isRaml08Version ? RamlDefinitionConverter.createDefinition(ramlDef, attrIdMap, attrIdCopyRaml08) : RamlDefinitionConverter.createDefinition(ramlDef, attrIdMap, attrIdCopyRaml10);

			if (isRaml08Version) {
				if (ramlDef.hasOwnProperty('$ref')) {
					model.reference = ramlDef.$ref.startsWith('http://') ? ramlDef.$ref : ramlDef.$ref.replace('#/schemas/', '').replace('#/definitions/', '');
				}
			}

			if (ramlDef.hasOwnProperty('oneOf')) {
				if (ramlDef.oneOf.length > 1) {
					ramlDef.type = 'object';
				} else {
					ramlDef = Object.assign(ramlDef, ramlDef.oneOf[0]);
				}
				delete ramlDef.oneOf;
			}

			if (jsonType) {
				model.jsonValue = RamlDefinitionConverter._readTypeAttribute(ramlDef.type);
			} else {
				if (ramlDef.hasOwnProperty('schemaPath')) {
					if (ramlDef.name.endsWith('/json')) {
						var _value3 = JSON.parse(ramlDef.type);
						_.assign(model, this._import(_value3));
					} else model.type = 'object';
				} else if (ramlDef.hasOwnProperty('type')) {
					if (ramlHelper.isRaml08Version(this.version)) {
						if (_.isArray(ramlDef.type) && _.isEmpty(ramlDef.type)) {
							ramlDef.type = 'array';
							ramlDef.items = { type: 'string' };
						}
						// TODO: check lrg cases
						/*if (ramlDef.type === 'array') {
      	for (const id in model) {
      		if (!model.hasOwnProperty(id)) continue;
      		
      		if (id != 'items' && _.isArray(model[id])) delete model[id];
      	}
      }*/
					}
					var _value4 = RamlDefinitionConverter._readTypeAttribute(ramlDef.type);
					if (_.isArray(_value4)) {
						var compositionType = [];
						_value4.map(function (entry) {
							var typeModel = new Definition();
							_this2._convertSimpleType(entry, typeModel);
							compositionType.push(typeModel);
						});
						if (arrayHelper.allEqual(compositionType)) {
							_.merge(model, compositionType[0]);
						} else {
							model.compositionType = compositionType;
						}
					} else {
						if ((typeof _value4 === 'undefined' ? 'undefined' : _typeof(_value4)) === 'object') {
							// TODO: check lrg cases
							// model.type = this._import(value);
						} else if (_value4.indexOf('|') > -1) {
							this._convertOneOfType(_value4, model);
						} else {
							this._convertSimpleType(_value4, model);
						}
					}
				} else {
					//default type is string
					if (!ramlDef.hasOwnProperty('properties') && !ramlDef.hasOwnProperty('$ref')) model.type = 'string';
				}

				RamlDefinitionConverter._convertToInternalType(model);
			}

			if (ramlDef.hasOwnProperty('properties')) {
				var required = ramlDef.hasOwnProperty('required') && _.isArray(ramlDef.required) ? ramlDef.required.filter(function (req) {
					return Object.keys(ramlDef.properties).includes(req);
				}) : [];
				var ignoreRequired = !_.isEmpty(required);

				var modelProps = [];
				for (var id in ramlDef.properties) {
					if (!ramlDef.properties.hasOwnProperty(id)) continue;

					var _value5 = ramlDef.properties[id];
					if (id.startsWith('/') && id.endsWith('/')) {
						//additionalProperties
						model.additionalProperties = this._import(_value5);
					} else {
						if (!required.includes(id) && (!ignoreRequired && !isRaml08Version && !_value5.hasOwnProperty('required') || _value5.hasOwnProperty('required') && _value5.required === true)) required.push(id);

						if (_.isBoolean(_value5.required)) delete _value5.required;

						//union type property
						if (_.isArray(_value5)) {
							(function () {
								var val = { name: id, type: [] };
								_value5.map(function (v) {
									val.type.push(RamlDefinitionConverter._readTypeAttribute(v.type));
								});
								_value5 = val;
							})();
						}

						var prop = this._import(_value5);
						prop.name = id;
						modelProps.push(prop);
					}
				}
				if (ramlDef.type === 'array' && !ramlDef.hasOwnProperty('items')) {
					var items = new Definition();
					items.type = 'object';
					items.properties = modelProps;
					if (!_.isEmpty(required)) items.propsRequired = required;
					model.items = items;
				} else {
					model.properties = modelProps;
					if (!_.isEmpty(required)) model.propsRequired = required;
				}
			}

			if (ramlDef.hasOwnProperty('items')) {
				var _value6 = RamlDefinitionConverter._readTypeAttribute(ramlDef.items);
				if (typeof _value6 === 'string') {
					var modelItems = new Definition();
					if (_value6.endsWith('[]')) {
						modelItems.type = 'array';
						var def = new Definition();
						this._convertSimpleType(_value6.replace('[]', ''), def);
						RamlDefinitionConverter._convertToInternalType(def);
						modelItems.items = def;
					} else {
						this._convertSimpleType(_value6, modelItems);
						RamlDefinitionConverter._convertToInternalType(modelItems);
					}
					model.items = modelItems;
				} else if (isRaml08Version && _.isArray(ramlDef.items)) {
					if (_.isEmpty(ramlDef.items)) {
						var _modelItems = new Definition();
						_modelItems.type = 'string';
						model.items = _modelItems;
					} else if (ramlDef.items.length === 1) {
						var _items2 = ramlDef.items[0];
						model.items = this._import(_items2);
					} else {
						var _modelItems2 = [];
						for (var i = 0; i < ramlDef.items.length; i++) {
							var _items3 = this._import(ramlDef.items[i]);
							_modelItems2.push(_items3);
						}
						if (!_.isEmpty(_modelItems2)) model.itemsList = _modelItems2;
					}
				} else {
					var _items4 = RamlDefinitionConverter._readTypeAttribute(ramlDef.items);
					model.items = this._import(_items4);
				}
			}

			if (ramlDef.hasOwnProperty('schema')) {}
			// TODO: check lrg cases
			// const schema: Definition = this._export(ramlDef.schema);
			// model.schema = schema;


			//composition type
			if (model.hasOwnProperty('reference') && model.hasOwnProperty('properties')) {
				//todo check
				var composition = [];
				var definition = new Definition();
				definition.reference = model.reference;
				composition.push(definition);
				var properties = new Definition();
				properties.properties = model.properties;
				properties.propsRequired = model.propsRequired ? model.propsRequired : [];
				if (model.hasOwnProperty('additionalProperties')) {
					properties.additionalProperties = model.additionalProperties;
					delete model.additionalProperties;
				}
				composition.push(properties);

				delete model.reference;
				delete model.properties;
				delete model.propsRequired;

				model.compositionType = composition;
			}

			if (ramlDef.hasOwnProperty('description') && !_.isEmpty(ramlDef.description) && typeof ramlDef.description === 'string') {
				model.description = ramlDef.description;
			}

			if (ramlDef.hasOwnProperty('examples')) {
				var ramlExamples = ramlDef.examples;
				var examples = [];
				for (var _i5 = 0; _i5 < ramlExamples.length; _i5++) {
					var entry = ramlExamples[_i5];
					var result = jsonHelper.parse(entry.value);
					if (entry.hasOwnProperty('strict') && !entry.strict) {
						result.strict = entry.strict;
					}
					examples[_i5] = result;
				}

				if (_.isArray(examples)) model.examples = examples;
			}

			if (ramlDef.hasOwnProperty('example')) {
				var example = void 0;
				if (_typeof(ramlDef.example) === 'object' && !_.isArray(ramlDef.example) && !_.isEmpty(ramlDef.example)) {
					var annotationConverter = new RamlAnnotationConverter();
					var annotations = annotationConverter._import(ramlDef.example);
					if (!_.isEmpty(annotations)) ramlDef.example.annotations = annotations;
					example = ramlDef.example;
				} else {
					example = ramlDef.example;
				}
				if (ramlDef.hasOwnProperty('structuredExample') && ramlDef.structuredExample.hasOwnProperty('strict') && !ramlDef.structuredExample.strict) {
					if ((typeof example === 'undefined' ? 'undefined' : _typeof(example)) === 'object') example.strict = ramlDef.structuredExample.strict;else example = { value: model.example, strict: ramlDef.structuredExample.strict };
				}
				model.example = example;
			}

			if (ramlDef.hasOwnProperty('enum') && ramlDef.type !== 'boolean') {
				model._enum = ramlDef.enum;
			}

			if (model.hasOwnProperty('required') && !model.hasOwnProperty('properties') && _.isArray(model.required)) {
				delete model.required;
			}

			if (ramlDef.hasOwnProperty('sourceMap') && ramlDef['sourceMap'].hasOwnProperty('path')) {
				model['includePath'] = ramlDef['sourceMap']['path'];
				delete ramlDef['sourceMap'];
			}

			return model;
		}
	}, {
		key: '_convertSimpleType',
		value: function _convertSimpleType(entry, model) {
			if (typeof entry !== 'string' || entry === undefined) return;
			var val = void 0;
			if (entry.indexOf('|') < 0) {
				val = entry.replace('(', '').replace(')', '');
			} else {
				var scalarType = true;
				entry.split('|').map(function (part) {
					if (part !== '' && scalarTypes.indexOf(part) < 0) {
						scalarType = false;
					}
				});
				val = scalarType ? 'string' : 'object';
			}
			val = val.endsWith('?') || xmlHelper.isXml(val) ? 'object' : val;
			if (val.endsWith('[]')) {
				val = val.replace('[]', '');
				_.assign(model, {
					type: 'array',
					items: {}
				});

				this._convertSimpleType(val, model.items);
			} else {
				var isRaml08Version = ramlHelper.isRaml08Version(this.version);
				var builtinTypes = isRaml08Version ? raml08BuiltinTypes : raml10BuiltinTypes;
				if (builtinTypes.indexOf(val) < 0) {
					if (isRaml08Version && this.def && this.def.schemas && !this.def.schemas.map(function (schema) {
						return _.keys(schema)[0];
					}).includes(val)) model.type = 'string';else model.reference = val;
				} else model.type = val;
			}
		}
	}, {
		key: '_convertOneOfType',
		value: function _convertOneOfType(values, model) {
			var types = values.split('|');
			var oneOf = [];
			for (var i = 0; i < types.length; i++) {
				var type = types[i];
				oneOf.push(this._import({ type: type.split(' ').join('') }));
			}
			model.oneOf = oneOf;
		}
	}, {
		key: '_convertFromInternalType',
		value: function _convertFromInternalType(ramlDef) {
			if (!ramlDef.hasOwnProperty('internalType')) return;
			var internalType = ramlDef.internalType;

			if (internalType === 'integer') {
				ramlDef.type = 'integer';
			} else if (internalType === 'number') {
				ramlDef.type = 'number';
			} else if (internalType === 'null') {
				ramlDef.type = 'null';
			} else if (internalType === 'int') {
				ramlDef.type = 'integer';
				ramlDef.format = 'int';
			} else if (internalType === 'int8') {
				ramlDef.type = 'integer';
				ramlDef.format = 'int8';
			} else if (internalType === 'int16') {
				ramlDef.type = 'integer';
				ramlDef.format = 'int16';
			} else if (internalType === 'int32') {
				ramlDef.type = 'integer';
				ramlDef.format = 'int32';
			} else if (internalType === 'int64') {
				ramlDef.type = 'integer';
				ramlDef.format = 'int64';
			} else if (internalType === 'float') {
				ramlDef.type = 'number';
				ramlDef.format = 'float';
			} else if (internalType === 'double') {
				ramlDef.type = 'number';
				ramlDef.format = 'double';
			} else if (internalType === 'boolean') {
				ramlDef.type = 'boolean';
			} else if (internalType === 'string') {
				ramlDef.type = 'string';
			} else if (internalType === 'byte') {
				ramlDef.type = 'string';
				var id = this.annotationPrefix + '-format';
				RamlCustomAnnotationConverter._createAnnotationType(this.def, this.annotationPrefix, id);
				ramlDef['(' + id + ')'] = 'byte';
			} else if (internalType === 'binary') {
				ramlDef.type = 'string';
				var _id10 = this.annotationPrefix + '-format';
				RamlCustomAnnotationConverter._createAnnotationType(this.def, this.annotationPrefix, _id10);
				ramlDef['(' + _id10 + ')'] = 'binary';
			} else if (internalType === 'password') {
				ramlDef.type = 'string';
				var _id11 = this.annotationPrefix + '-format';
				RamlCustomAnnotationConverter._createAnnotationType(this.def, this.annotationPrefix, _id11);
				ramlDef['(' + _id11 + ')'] = 'password';
			} else if (internalType === 'file') {
				ramlDef.type = 'file';
			} else if (internalType === 'dateonly') {
				ramlDef.type = 'date-only';
			} else if (internalType === 'datetime') {
				ramlDef.type = 'datetime';
			} else if (internalType === 'timeonly') {
				ramlDef.type = 'time-only';
			} else if (internalType === 'datetimeonly') {
				ramlDef.type = 'datetime-only';
			} else if (internalType === 'timestamp') {
				ramlDef.type = 'timestamp';
			} else if (internalType === 'object') {
				ramlDef.type = 'object';
			} else if (internalType === 'array') {
				ramlDef.type = 'array';
			}

			delete ramlDef.internalType;
		}
	}], [{
		key: '_convertMapToArray',
		value: function _convertMapToArray(map) {
			var result = [];
			for (var id in map) {
				if (!map.hasOwnProperty(id)) continue;
				var value = {};
				value[id] = map[id];
				result.push(value);
			}
			return result;
		}
	}, {
		key: 'createRamlDef',
		value: function createRamlDef(definition, attrIdMap, attrIdSkip) {
			var result = {};

			_.assign(result, definition);
			attrIdSkip.map(function (id) {
				delete result[id];
			});
			_.keys(attrIdMap).map(function (id) {
				var value = result[id];
				if (value != null) {
					result[attrIdMap[id]] = value;
					delete result[id];
				}
			});

			return result;
		}
	}, {
		key: 'createDefinition',
		value: function createDefinition(ramlDef, attrIdMap, attrIdCopy) {
			var object = {};

			_.entries(ramlDef).map(function (_ref) {
				var _ref2 = _slicedToArray(_ref, 2),
				    key = _ref2[0],
				    value = _ref2[1];

				if (attrIdCopy.indexOf(key) >= 0 || key.startsWith('(')) {
					object[attrIdMap.hasOwnProperty(key) ? attrIdMap[key] : key] = value;
				}
			});
			var result = new Definition();
			_.assign(result, object);

			return result;
		}
	}, {
		key: '_readTypeAttribute',
		value: function _readTypeAttribute(value) {
			if (_.isArray(value) && !_.isEmpty(value) && _.size(value) === 1) return value[0];

			return value;
		}
	}, {
		key: '_convertAnnotations',
		value: function _convertAnnotations(ramlDef) {
			var annotationConverter = new RamlAnnotationConverter();
			var annotations = annotationConverter._import(ramlDef);
			if (!_.isEmpty(annotations)) ramlDef.annotations = annotations;
		}
	}, {
		key: '_convertToInternalType',
		value: function _convertToInternalType(model) {
			var hasFormat = model.hasOwnProperty('format');
			var type = model.type;
			var format = hasFormat ? model.format : null;

			if (type === 'integer') model.internalType = 'integer';
			if (type === 'number') model.internalType = 'number';
			if (type === 'boolean') model.internalType = 'boolean';
			if (type === 'string' && !hasFormat) model.internalType = 'string';
			if (type === 'any') model.internalType = 'string';
			if (type === 'date') model.internalType = 'datetime';
			if (type === 'time-only') model.internalType = 'timeonly';
			if (type === 'datetime' && (format === 'rfc3339' || format === 'rfc2616' || !format)) model.internalType = 'datetime';else if (type === 'datetime' && format) model.internalType = 'string';
			if (type === 'datetime-only') model.internalType = 'datetimeonly';
			if (type === 'date-only') model.internalType = 'dateonly';
			if (type === 'file') model.internalType = 'file';
			if (type === 'null') model.internalType = 'null';
			if (type === 'timestamp') model.internalType = 'timestamp';
			if (type === 'object') model.internalType = 'object';
			if (type === 'array') model.internalType = 'array';

			if (model.hasOwnProperty('internalType')) {
				delete model.type;
				if (model.internalType === 'integer' && !integerValidFormats.includes(format) || model.internalType === 'number' && !numberValidFormats.includes(format)) delete model.format;
			}
		}
	}, {
		key: 'exportExample',
		value: function exportExample(example, model, def) {
			var ramlDef = example;
			if (ramlDef.hasOwnProperty('annotations')) {
				var annotationConverter = new RamlAnnotationConverter(model, '', def);
				_.assign(ramlDef, annotationConverter._export(ramlDef));
				delete ramlDef.annotations;
			}
			for (var id in ramlDef) {
				if (!ramlDef.hasOwnProperty(id)) continue;

				if (_typeof(ramlDef[id]) === 'object' && !_.isEmpty(ramlDef[id])) ramlDef[id] = RamlDefinitionConverter.exportExample(ramlDef[id], model, def);
			}

			return ramlDef;
		}
	}]);

	return RamlDefinitionConverter;
}(Converter);

var scalarNumberTypes = ['number', 'integer'];
var scalarTypes = _.concat(scalarNumberTypes, ['string', 'boolean', 'datetime', 'date-only', 'file', 'time-only', 'datetime-only', 'nil', 'null', 'timestamp']);
var integerValidFormats = ['int', 'int8', 'int16', 'int32', 'int64'];
var numberValidFormats = _.concat(integerValidFormats, ['long', 'float', 'double']);
var raml10BuiltinTypes = _.concat(scalarTypes, ['any', 'array', 'object', 'union']);
var raml08BuiltinTypes = _.concat(raml10BuiltinTypes, ['date']);

module.exports = RamlDefinitionConverter;