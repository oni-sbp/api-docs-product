'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var fs = require('fs');
var _ = require('lodash');
var Stack = require('../utils/stack');
var stringsHelper = require('../utils/strings');
var os = require('os');

var methods = ['get', 'post', 'put', 'patch', 'options', 'head', 'delete'];

var RamlErrorModel = function () {
	function RamlErrorModel() {
		_classCallCheck(this, RamlErrorModel);

		this.path = new Stack();
	}

	_createClass(RamlErrorModel, [{
		key: 'addErrorNodesFromPath',
		value: function addErrorNodesFromPath(filePath, model, errors) {
			var _this = this;

			return errors.forEach(function (error) {
				var fileContent = fs.readFileSync(filePath, 'utf8');
				_this.createPathFromLineNumber(fileContent, error.range.start.line);
				_this.addErrorToModel(model, error);
			});
		}
	}, {
		key: 'addErrorNodesFromContent',
		value: function addErrorNodesFromContent(fileContent, model, errors) {
			var _this2 = this;

			return errors.forEach(function (error) {
				_this2.createPathFromLineNumber(fileContent, error.range.start.line);
				_this2.addErrorToModel(model, error);
			});
		}
	}, {
		key: 'addError',
		value: function addError(model, field, error) {
			var key = error.isWarning ? 'warning' : 'error';
			if (!model[key]) model[key] = {};
			model[key][field] = error.message;
		}
	}, {
		key: 'addErrorToModel',
		value: function addErrorToModel(model, error) {
			var elem = this.path.pop();
			if (elem.startsWith('/')) //resources
				this.addErrorToResource(model, elem, error);else if (elem === 'types') //types
				this.addErrorToType(model, error);else if (elem === 'version' && error.message === "Missing required property 'title'") this.addError(model, 'title', error);else if (elem === 'documentation') this.addErrorToDocumentation(model, error);else if (elem === 'baseUriParameters') {
				var param = this.getParameter(model.baseUriParameters, this.path.pop());
				this.addErrorToProp(param.definition, error);
			} else this.addError(model, 'root', error);
		}
	}, {
		key: 'addErrorToDocumentation',
		value: function addErrorToDocumentation(model, error) {
			var index = this.path.pop();
			var field = error.message === "Missing required property 'title'" ? 'name' : error.message === "Missing required property 'content'" ? 'value' : 'root';
			var item = model.documentation[index];
			if (field === 'name') delete item.name;else if (field === 'value') delete item.value;
			this.addError(item, field, error);
		}
	}, {
		key: 'addErrorToType',
		value: function addErrorToType(model, error) {
			var typeName = this.path.pop();
			var type = this.getType(model.types, typeName);
			if (this.path.isEmpty()) {
				this.addError(type, 'root', error);
			} else {
				var field = this.path.pop();
				if (this.path.isEmpty()) this.addError(type, field, error);else if (field === 'properties') {
					var propName = this.path.pop();
					this.addErrorToProp(this.getProperty(type.properties, propName), error);
				} else if (field === 'example') {
					this.addExampleError(type, error);
				}
			}
		}
	}, {
		key: 'addErrorToProp',
		value: function addErrorToProp(prop, error) {
			if (this.path.isEmpty()) {
				this.addError(prop, 'root', error);
			} else if (this.path.size() === 1) {
				var field = this.path.pop();
				this.addError(prop, field, error);
			} else if (this.path.pop() === 'properties') {
				var propName = this.path.pop();
				this.addErrorToProp(this.getProperty(prop.properties, propName), error);
			}
		}
	}, {
		key: 'addErrorToResource',
		value: function addErrorToResource(model, path, error) {
			var resource = this.getResource(model.resources, path);
			if (this.path.isEmpty()) {
				this.addError(resource, 'root', error);
			} else {
				var elem = this.path.pop();
				if (methods.indexOf(elem) === -1) {
					// uriParameters
					var paramName = this.path.pop();
					var param = this.getParameter(resource.parameters, paramName);
					this.addErrorToProp(param.definition, error);
				} else {
					// methods
					var method = this.getMethod(resource.methods, elem);
					this.addErrorToResourceProp(method, error);
				}
			}
		}
	}, {
		key: 'addErrorToResourceProp',
		value: function addErrorToResourceProp(prop, error) {
			if (this.path.isEmpty()) {
				this.addError(prop, 'root', error);
			} else {
				var elem = this.path.pop();
				if (elem === 'body') {
					// request bodies
					var body = this.getBody(prop.bodies, this.path.pop());
					this.addErrorToProp(body.definition, error);
				} else if (elem === 'queryParameters') {
					// query parameters
					var param = this.getParameter(prop.parameters, this.path.pop());
					this.addErrorToProp(param.definition, error);
				} else if (elem === 'headers') {
					// headers
					var header = this.getParameter(prop.headers, this.path.pop());
					this.addErrorToProp(header.definition, error);
				} else if (elem === 'responses') {
					// responses
					var response = this.getResponse(prop.responses, this.path.pop());
					this.addErrorToResourceProp(response, error);
				} else {
					this.addError(prop, 'root', error);
				}
			}
		}
	}, {
		key: 'addExampleError',
		value: function addExampleError(prop, error) {
			var prefix = '';
			var errorMsg = error.message;
			while (!this.path.isEmpty()) {
				prefix = prefix + (prefix !== '' ? '.' : '') + this.path.pop();
			}
			if (!prop.error) prop.error = {};
			prop.error.example = prefix + ': ' + errorMsg;
		}
	}, {
		key: 'createPathFromLineNumber',
		value: function createPathFromLineNumber(fileContent, lineNumber) {
			var lines = fileContent.split(os.EOL);
			var line = lines[lineNumber];
			var lineIndent = stringsHelper.getIndent(line);
			if (line.substr(lineIndent).startsWith('-')) {
				this.createListPath(lines, lineNumber, lineIndent);
			} else {
				this.path.push(_.trimStart(line.substr(0, line.indexOf(':'))));
				var resource = '';

				for (var count = lineNumber; count > 0; count--) {
					var currentLine = lines[count];
					var currentIndent = stringsHelper.getIndent(currentLine);
					if (currentIndent < lineIndent) {
						lineIndent = currentIndent;
						var elem = _.trimStart(currentLine.substr(0, currentLine.indexOf(':')));
						if (elem.startsWith('/') && currentIndent > 0) {
							resource = elem + resource;
						} else {
							if (resource !== '') {
								resource = elem + resource;
								this.path.push(resource);
							} else {
								this.path.push(elem);
							}
						}
					}
				}
			}
		}
	}, {
		key: 'createListPath',
		value: function createListPath(lines, lineNumber, lineIndent) {
			var i = lineNumber;
			var newLineIndent = lineIndent;
			var line = '';
			var index = 0;
			while (newLineIndent >= lineIndent && i >= 0) {
				i = i - 1;
				line = lines[i];
				newLineIndent = stringsHelper.getIndent(line);
				if (line.substr(newLineIndent).startsWith('-')) index = index + 1;
			}
			this.path.push(index + '');
			this.path.push(_.trimStart(line.substr(0, line.indexOf(':'))));
		}
	}, {
		key: 'getBody',
		value: function getBody(bodies, mimeType) {
			return bodies.find(function (b) {
				return b.mimeType === mimeType;
			});
		}
	}, {
		key: 'getProperty',
		value: function getProperty(properties, propName) {
			return properties.find(function (p) {
				return p.name === propName;
			});
		}
	}, {
		key: 'getType',
		value: function getType(types, typeName) {
			return types.find(function (t) {
				return t.name === typeName;
			});
		}
	}, {
		key: 'getParameter',
		value: function getParameter(parameters, paramName) {
			return parameters.find(function (p) {
				return p.name === paramName;
			});
		}
	}, {
		key: 'getResponse',
		value: function getResponse(methodResponses, statusCode) {
			return methodResponses.find(function (r) {
				return r.httpStatusCode === statusCode || r.httpStatusCode === statusCode.split("'")[1];
			});
		}
	}, {
		key: 'getMethod',
		value: function getMethod(resourceMethods, method) {
			return resourceMethods.find(function (m) {
				return m.method === method;
			});
		}
	}, {
		key: 'getResource',
		value: function getResource(resources, fullPath) {
			return resources.find(function (r) {
				return r.path === fullPath;
			});
		}
	}]);

	return RamlErrorModel;
}();

module.exports = RamlErrorModel;