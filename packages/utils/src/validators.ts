import Ajv from "ajv";
import memoizee from "memoizee";

export const getValidator = memoizee((schema: any) => {
  const ajv = new Ajv({
    useDefaults: true,
    coerceTypes: true,
  });
  return {
    errors: ajv.errorsText,
    validate: ajv.compile(
      typeof schema == "string" ? JSON.parse(schema) : schema
    ),
  };
});
