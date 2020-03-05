exports.RESOURCES = 'resources'
exports.ARCHIVES_FOLDER = process.cwd() + '/resources/Archives/'
exports.LOG_FILES_FOLDER = process.cwd() + '/resources/Log Files/'
exports.TEMP_FILES_FOLDER = process.cwd() + '/resources/Temp-Files/'
exports.GENERATED_EXAMPLES_FOLDER = 'Generated-examples/'
exports.ARCHIVE_NAME = 'archive.zip'
exports.GENERATION_LOG_FILE = 'generationLogFile.txt'
exports.VALIDATION_LOG_FILE = 'validationLogFile.txt'
exports.DOCS_PAGE = 'build/index.html'
exports.DOCS_SOURCE = 'source'
exports.DOCS_BUILD = 'build'
exports.REQUEST_FOLDER = process.cwd() + '/resources/Temp-Files/request_'
exports.TEMPLATES_FOLDER = process.cwd() + '/templates'

exports.HEAD_PLACEHOLDER_ANALYTICS = '<PlaceholderForHeadAnalytics>'
exports.BODY_PLACEHOLDER_ANALYTICS = '<PlaceholderForBodyAnalytics>'
exports.HEAD_ANALYTICS = `<!-- Google Tag Manager -->
    <script>
        (function (w, d, s, l, i) {
            w[l] = w[l] || [];
            w[l].push({
                'gtm.start': new Date().getTime(),
                event: 'gtm.js'
            });
            var f = d.getElementsByTagName(s)[0],
                j = d.createElement(s),
                dl = l != 'dataLayer' ? '&l=' + l : '';
            j.async = true;
            j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
            f.parentNode.insertBefore(j, f);
        })(window, document, 'script', 'dataLayer', 'GTM-PF6T7H3');
    </script>
    <!-- End Google Tag Manager -->`
exports.BODY_ANALYTICS = `<!-- Google Tag Manager (noscript) -->
    <noscript>
        <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-PF6T7H3" height="0" width="0"
            style="display:none;visibility:hidden">
        </iframe>
    </noscript>
    <!-- End Google Tag Manager (noscript) -->`
