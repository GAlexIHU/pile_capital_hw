import {
  type Interceptor,
  type QueryResultRow,
  SchemaValidationError,
} from "slonik";

export const createResultParserInterceptor = (): Interceptor => ({
  transformRow: async (executionContext, actualQuery, row) => {
    const { resultParser } = executionContext;

    if (!resultParser) {
      return row;
    }

    // It is recommended (but not required) to parse async to avoid blocking the event loop during validation
    const validationResult = await resultParser.safeParseAsync(row);

    if (!validationResult.success) {
      throw new SchemaValidationError(
        actualQuery,
        row,
        validationResult.error.issues,
      );
    }

    return validationResult.data as QueryResultRow;
  },
});
