import type { NextRequest } from "next/server";
import * as yup from "yup";

export type validateRequestError = {
  error?: string;
  status?: number;
};

export const validateRequest = async <
  Schema extends yup.AnyObjectSchema,
  T = yup.InferType<Schema>,
>(
  request: NextRequest,
  schema: Schema,
  options: yup.ValidateOptions
): Promise<T | validateRequestError> => {
  const body = await request.clone().json();

  try {
    const validated = await schema.validate(body, options);
    return validated as T;
  } catch (err) {
    if (err instanceof yup.ValidationError) {
      const message = err.errors.join("; ");
      // take “must match” errors as forbidden
      const status = err.errors.some((e) => /must match/.test(e)) ? 403 : 400;
      return { error: message, status };
    }
    return { error: "Validation failed", status: 400 };
  }
};

export const isValidateRequestError = (
  result: unknown
): result is validateRequestError => {
  return (
    typeof result === "object" &&
    result !== null &&
    "error" in result &&
    "status" in result
  );
};
