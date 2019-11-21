const SampleRuntimeError = new Error('SampleRuntimeError')
const OutputParsingError = new Error('OutputParsingError')
const NonZeroExitCode = new Error('NonZeroExitCode')
const UnexpectedResult = new Error('UnexpectedResult')
const BadRequest = new Error('BadRequest')
const ExecutionTimeout = new Error('ExecutionTimeout')
const ConformToSchemaError = new Error('ConformToSchemaError')

module.exports = {
  SampleRuntimeError,
  OutputParsingError,
  NonZeroExitCode,
  UnexpectedResult,
  BadRequest,
  ExecutionTimeout,
  ConformToSchemaError
}
