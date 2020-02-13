// Import the dataTypes objects
const DataTypes = require('./dataTypes')

function parse(parameters, pathParameters, parseDoc) {

    const res = []
    res.push('**Parameters**\n')
    res.push('| Name | Located in | Description | Required | Type |')
    res.push('| ---- | ---------- | ----------- | -------- | ---- |')

    // Maps the parameters and set values into the parameters value line
    var arr = []
    arr.concat(pathParameters, parameters).map(keys => {

        if (keys) {

            const line = []
            line.push(keys.name || '')
            line.push(keys.in || '')

            if ('description' in keys) {
                line.push(keys.description.replace(/[\r\n]/g, ' '))
            } else {
                line.push('')
            }

            line.push(keys.required ? 'Yes' : 'No')
            line.push('type' in keys
                ? DataTypes(keys.type, keys.format || null)
                : '')

            res.push(`|${line.map(el => ` ${el} `).join('|')}|`)


        }
    })
    var isFirstTime = true
    for (var i = 0 in parameters) {
        if (parameters[i]['in'] == 'body') {
            if (parameters[i]['schema']['$ref']) {
                var newPath = parameters[i]['schema']['$ref'].split('/')
                var items = parseDoc['definitions'][newPath[newPath.length - 1]]
                if (Array.isArray(items) || items instanceof Object) {
                    var desc = ' - '
                    if (items['description'] != undefined) {
                        desc = ' - ' + items['description']
                    }
                    if (!recursion(res, items['properties'], items['required'], items['type'], desc, newPath[newPath.length - 1], true, isFirstTime)) {
                        if (isFirstTime) { res.push('</ul>') }
                        isFirstTime = false
                        res.push('</ul>')
                        res.push('</ul>')
                    }
                }
            }

        }
    }
    return res.join('\n')
}

function PropertiesSpec(res, type, name, description, isFirstTime) {
    if (isFirstTime) {
        res.push("<p><b>Body properties</b></p>")
        res.push('<p><font color="red">* - Required property </font> <br></p>')
    }
    res.push('<ul>')
    if (description != ' - ') {
        res.push('<li>', type, name, description, '</li>')
    }
    else {
        res.push('<li>', type, name, '</li>')

    }
}



function recursion(res, items, required, type, description, name, objectFirstTime, isFirstTime) {
    var displayed = false
    for (var current in items) {
        if (objectFirstTime) {
            PropertiesSpec(res, type, name, description, isFirstTime)
            objectFirstTime = false
        }
        var actualRequire = ' '
        if (required && required.indexOf(current) >= 0) {
            actualRequire = '<font color="red"> *</font> '
        }
        if (displayed == false) {
            displayed = true
            res.push("<ul>")
        }
        if (items[current]['description'] != undefined) {
            actualRequire = actualRequire + ' - ' + items[current]['description']
        }
        var toPrint = items[current]['type'] + ' ' + current + actualRequire
        res.push('<li>', toPrint, '</li>')
        if (items[current] instanceof Object) {
            recursion(res, items[current]['properties'], items['required'], type, description, name, objectFirstTime, isFirstTime)
        }
    }
    if (displayed == true) {
        res.push("</ul>")
    }
    return objectFirstTime
}


// Export the parse method of parameters object
module.exports = { parse }

