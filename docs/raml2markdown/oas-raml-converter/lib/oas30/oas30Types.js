'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// TODO: extensions { [string]: any }

/**
 * This is the root document object of the OpenAPI definition.
 */
var Model = function Model() {
	var info = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : new Info();

	_classCallCheck(this, Model);

	this.openapi = '3.0.0';
	this.info = info;
	this.servers = [];
	this.paths = {};
	this.components = new Components();
};

module.exports.Model = Model;

/**
 * The object provides metadata about the API. The metadata MAY be used by the clients if
 * needed, and MAY be presented in editing or documentation generation tools for
 * convenience.
 */

var Info = function Info() {
	var title = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
	var version = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

	_classCallCheck(this, Info);

	this.title = title;
	this.version = version;
};

module.exports.Info = Info;

var Contact = function Contact() {
	_classCallCheck(this, Contact);
};

module.exports.Contact = Contact;

var License = function License() {
	var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

	_classCallCheck(this, License);

	this.name = name;
};

module.exports.License = License;

var Server = function Server(url) {
	_classCallCheck(this, Server);

	this.url = url;
};

module.exports.Server = Server;

var ServerVariable = function ServerVariable(default_) {
	_classCallCheck(this, ServerVariable);

	this.default = default_;
};

module.exports.ServerVariable = ServerVariable;

var Components = function Components() {
	_classCallCheck(this, Components);

	this.schemas = {};
	this.responses = {};
	this.parameters = {};
	this.examples = {};
	this.requestBodies = {};
	this.headers = {};
	this.securitySchemes = {};
	this.links = {};
	this.callbacks = {};
};

module.exports.Components = Components;

var PathItem = function PathItem() {
	_classCallCheck(this, PathItem);
};

module.exports.PathItem = PathItem;

var Operation = function Operation() {
	var responses = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : { default: new Response('') };

	_classCallCheck(this, Operation);

	this.responses = responses;
};

module.exports.Operation = Operation;

var ExternalDocumentation = function ExternalDocumentation(url) {
	_classCallCheck(this, ExternalDocumentation);

	this.url = url;
};

module.exports.ExternalDocumentation = ExternalDocumentation;

/**
 * Describes a single operation parameter.
 *
 * A unique parameter is defined by a combination of a name and location.
 */
var Parameter = function Parameter(name, in_) {
	var required = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

	_classCallCheck(this, Parameter);

	this.name = name;
	this.in = in_;
	this.required = required;
};

module.exports.Parameter = Parameter;

var RequestBody = function RequestBody(content) {
	_classCallCheck(this, RequestBody);

	this.content = content;
};

module.exports.RequestBody = RequestBody;

var MediaType = function MediaType() {
	_classCallCheck(this, MediaType);
};

module.exports.MediaType = MediaType;

var Encoding = function Encoding() {
	_classCallCheck(this, Encoding);
};

module.exports.Encoding = Encoding;

var Response = function Response(description) {
	_classCallCheck(this, Response);

	this.description = description;
};

module.exports.Response = Response;

var Example = function Example() {
	_classCallCheck(this, Example);
};

module.exports.Example = Example;

var Link = function Link() {
	_classCallCheck(this, Link);
};

module.exports.Link = Link;

// params without name and in

var Header = function Header(required) {
	_classCallCheck(this, Header);

	this.required = required;
};

module.exports.Header = Header;

var Tag = function Tag(name) {
	_classCallCheck(this, Tag);

	this.name = name;
};

module.exports.Tag = Tag;

var Reference = function Reference($ref) {
	_classCallCheck(this, Reference);

	this.$ref = $ref;
};

module.exports.Reference = Reference;

// JSON Schema

var Discriminator = function Discriminator(propertyName) {
	_classCallCheck(this, Discriminator);

	this.propertyName = propertyName;
};

module.exports.Discriminator = Discriminator;

/**
 * A metadata object that allows for more fine-tuned XML model definitions.
 *
 * When using arrays; XML element names are not inferred (for singular/plural forms) and
 * the name property SHOULD be used to add that information. See examples for expected behavior.
 */

var XML = function XML() {
	_classCallCheck(this, XML);
};

module.exports.XML = XML;

var SecurityScheme = function SecurityScheme(type) {
	_classCallCheck(this, SecurityScheme);

	this.type = type;
};

module.exports.SecurityScheme = SecurityScheme;

var OAuthFlows = function OAuthFlows() {
	_classCallCheck(this, OAuthFlows);
};

module.exports.OAuthFlows = OAuthFlows;

var OAuthFlow = function OAuthFlow() {
	_classCallCheck(this, OAuthFlow);
};

module.exports.OAuthFlow = OAuthFlow;