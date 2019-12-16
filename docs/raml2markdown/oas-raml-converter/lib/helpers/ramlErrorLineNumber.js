'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Stack = require('../utils/stack');
var Document = require('../utils/document');
var Line = require('../utils/line');

var RamlErrorLineNumber = function () {
	function RamlErrorLineNumber(fileContent, modelPath) {
		_classCallCheck(this, RamlErrorLineNumber);

		this.document = Document.create(fileContent);
		this.path = Stack.create(modelPath, '.');
	}

	_createClass(RamlErrorLineNumber, [{
		key: 'getLineNumber',
		value: function getLineNumber() {
			var line = this.path.pop();
			if (line === 'types') {
				return this.getTypeLine();
			} else if (line === 'resources') {
				return this.getResourceLine();
			}

			return -1;
		}
	}, {
		key: 'getLineByContent',
		value: function getLineByContent(data) {
			var fromLineNumber = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
			var indent = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : -1;

			var partialDoc = this.document.getLinesFrom(fromLineNumber);

			var _iteratorNormalCompletion = true;
			var _didIteratorError = false;
			var _iteratorError = undefined;

			try {
				for (var _iterator = partialDoc[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
					var l = _step.value;

					if ((indent === -1 || l.getIndent() === indent) && l.getData().startsWith(data)) return l;
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
	}, {
		key: 'getLineByIndex',
		value: function getLineByIndex(index) {
			var fromLineNumber = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
			var indent = arguments[2];


			var partialDoc = this.document.getLinesFrom(fromLineNumber);
			var currentIndex = 0;

			var _iteratorNormalCompletion2 = true;
			var _didIteratorError2 = false;
			var _iteratorError2 = undefined;

			try {
				for (var _iterator2 = partialDoc[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
					var l = _step2.value;

					if (l.getIndent() === indent) {
						if (currentIndex === index) return l;else currentIndex = currentIndex + 1;
					}
				}
			} catch (err) {
				_didIteratorError2 = true;
				_iteratorError2 = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion2 && _iterator2.return) {
						_iterator2.return();
					}
				} finally {
					if (_didIteratorError2) {
						throw _iteratorError2;
					}
				}
			}
		}
	}, {
		key: 'getTypeLine',
		value: function getTypeLine() {
			var line = this.getLineByContent('types:');
			if (line === undefined || line === null) return -1;

			var indent = this.getNextIndent(line);

			while (!this.path.isEmpty()) {
				var value = this.path.pop();
				line = isNaN(value) ? this.getLineByContent(value, line.getLineNumber(), indent) : this.getLineByIndex(parseInt(value), line.getLineNumber(), indent);
				if (line === undefined || line === null) return -1;

				if (this.path.isEmpty()) return line.getLineNumber();
				indent = this.getNextIndent(line);
			}

			return line.getLineNumber();
		}
	}, {
		key: 'getResourceLine',
		value: function getResourceLine() {
			//discard resources
			var resourceIndex = this.path.pop();
			var line = void 0;
			var fromLine = 0;

			for (var index = 0; index <= parseInt(resourceIndex); index = index + 1) {
				line = this.getLineByContent('/', fromLine);
				if (line === undefined || line === null) return -1;
				fromLine = line.getLineNumber() + 1;
			}

			var indent = this.getNextIndent(line);

			while (!this.path.isEmpty()) {
				var value = this.path.pop();
				if (value === 'methods' || value === 'mimeType' || value === 'definition') continue;else if (value === 'bodies')
					/*$ExpectError*/
					line = this.getLineByContent('body', line.getLineNumber(), indent);else if (value === 'parameters')
					/*$ExpectError*/
					line = this.getLineByContent('queryParameters', line.getLineNumber(), indent);else if (isNaN(value))
					/*$ExpectError*/
					line = this.getLineByContent(value, line.getLineNumber(), indent);else
					/*$ExpectError*/
					line = this.getLineByIndex(parseInt(value), line.getLineNumber(), indent);

				if (line === undefined || line === null) return -1;

				if (this.path.isEmpty()) return line.getLineNumber();
				indent = this.getNextIndent(line);
			}

			/*$ExpectError*/
			return line.getLineNumber();
		}
	}, {
		key: 'getNextIndent',
		value: function getNextIndent(line) {
			if (line === undefined || line === null) return 0;
			return this.document.getLine(line.getLineNumber() + 1).getIndent();
		}
	}]);

	return RamlErrorLineNumber;
}();

module.exports = RamlErrorLineNumber;
/*
	info: Info;
	protocols: ?string[];
	baseUri: ?BaseUri;
	mediaType: ?MediaType;
	securityDefinitions: ?SecurityDefinition[];
	resources: ?Resource[];
	types: ?Definition[];
	tags: ?Tag[];
	externalDocs: ?ExternalDocumentation;
	documentation: ?Item[];
	baseUriParameters: ?Parameter[];
	resourceTypes: ?ResourceType[];
	traits: ?Trait[];
	annotationTypes: ?AnnotationType[];
	annotations: ?Annotation[];
	resourceAnnotations: ?Resource;
	responses: ?Response[]; 
*/