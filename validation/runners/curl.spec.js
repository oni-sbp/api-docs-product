const expect = require('chai').expect
const rewire = require('rewire')
const curlRunner = rewire('./curl')
const _ = require('underscore')
const errors = require('../errors')

function getCurlRunner () {
  var runner = new curlRunner.CurlRunner()

  return runner
}

describe('test validation/runners/curl.js', () => {
  describe('test _parseStdout', () => {
    it('test that it throws OutputParsingError', () => {
      var runner = getCurlRunner()

      var stdout1 = `
            HTTP/1.1 200 Connection established

            HTTP/1.1 200 OK
            Content-Type: application/json
            Strict-Transport-Security: max-age=31536000; includeSubDomains; preload;
            Connection: close

            {
            `
      expect(() => runner._parseStdout(stdout1)).to.throw(errors.OutputParsingError)

      var stdout2 = `HTTP/1.1 200 Connection established

            HTTP/1.1 200 OK
            Content-Type: application/json
            Strict-Transport-Security: max-age=31536000; includeSubDomains; preload;
            Connection: close

            `
      expect(() => runner._parseStdout(stdout2)).to.throw(errors.OutputParsingError)

      var stdout3 = `HTTP/1.1 200 Connection established

            HTTP/1.1 200 OK
            Content-Type: application/json
            Strict-Transport-Security: max-age=31536000; includeSubDomains; preload;
            Connection: close

            "@type": "Owner"
            `
      expect(() => runner._parseStdout(stdout3)).to.throw(errors.OutputParsingError)
    })

    it("test that it doesn't throw OutputParsingError when statusCode is 204", () => {
      var runner = getCurlRunner()

      var stdout = `HTTP/1.1 200 Connection established

            HTTP/1.1 204 No Content
            Strict-Transport-Security: max-age=31536000; includeSubDomains; preload;

            `
      expect(() => runner._parseStdout(stdout)).to.not.throw()
      expect(_.isEqual(runner._parseStdout(stdout), { jsonBody: null, statusCode: '204' })).to.equal(true)
    })

    it('test that it parses correctly the output', () => {
      var runner = getCurlRunner()

      var stdout1 = `HTTP/1.1 200 Connection established

            HTTP/1.1 200 OK
            Content-Type: application/json
            Strict-Transport-Security: max-age=31536000; includeSubDomains; preload;
            Connection: close

            {"@context": "https://example.com/contexts/type.jsonld"}
            `
      expect(() => runner._parseStdout(stdout1)).to.not.throw()
      expect(_.isEqual(runner._parseStdout(stdout1), { jsonBody: { '@context': 'https://example.com/contexts/type.jsonld' }, statusCode: '200' })).to.equal(true)

      var stdout2 = `HTTP/1.1 200 OK
            Content-Type: application/json
            Strict-Transport-Security: max-age=31536000; includeSubDomains; preload;
            Connection: close

            {"@context": "https://example.com/contexts/type.jsonld"}
            `
      expect(() => runner._parseStdout(stdout2)).to.not.throw()
      expect(_.isEqual(runner._parseStdout(stdout2), { jsonBody: { '@context': 'https://example.com/contexts/type.jsonld' }, statusCode: '200' })).to.equal(true)
    })
  })
})

module.exports = {
  getCurlRunner
}
