'use strict';

var fs = require('fs');
var slugify = require('slugify');
var util = require('./util');
var urlHelper = require('../../src/utils/url');

var baseDir = __dirname + '../../../test/data/apis-guru/swagger';
var baseUrl = 'https://api.apis.guru/v2/specs/';

urlHelper.get('https://api.apis.guru/v2/list.json').then(function (body) {
	var apis = JSON.parse(body);
	var urls = [];
	Object.keys(apis).forEach(function (key) {
		var versions = apis[key].versions;
		Object.keys(versions).forEach(function (key) {
			var version = versions[key];
			urls.push(version.swaggerUrl);
		});
	});

	console.log('Dowloading ' + urls.length + ' swaggers');

	urls.forEach(function (url) {
		urlHelper.get(url).then(function (swagger) {
			var fileName = slugify(url.replace(baseUrl, ''));
			fs.writeFile(baseDir + '/' + fileName, swagger, function (error) {
				if (error) util.exit(error);
			});
		}).catch(util.exit);
	});
}).catch(util.exit);