import type { NextRequest } from "next/server";
import * as yup from "yup";

export type validateRequestError = {
  error?: string;
  status?: number;
};

export type PreValidator = (
  raw: unknown
) => validateRequestError | void | Promise<validateRequestError | void>;

export type ExtraValidator<T> = (
  data: T
) => validateRequestError | void | Promise<validateRequestError | void>;

export const validateRequest = async <
  Schema extends yup.AnyObjectSchema,
  T = yup.InferType<Schema>,
>(
  request: NextRequest,
  schema: Schema,
  options?: yup.ValidateOptions,
  validators?: {
    pre?: PreValidator;
    post?: ExtraValidator<T>;
  }
): Promise<T | validateRequestError> => {
  const body = await request.clone().json();

  let validated: T;

  if (validators?.pre) {
    const extraResult = await validators.pre(body);
    if (extraResult && "error" in extraResult) {
      return extraResult;
    }
  }

  try {
    validated = await schema.validate(body, options);
  } catch (err) {
    if (err instanceof yup.ValidationError) {
      const message = err.errors.join("; ");
      // take “must match” errors as forbidden
      const status = err.errors.some((e) => /must match/.test(e)) ? 403 : 400;
      return { error: message, status };
    }
    return { error: "Validation failed", status: 400 };
  }
  if (validators?.post) {
    const extraResult = await validators.post(validated);
    if (extraResult && "error" in extraResult) {
      return extraResult;
    }
  }
  return validated;
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
