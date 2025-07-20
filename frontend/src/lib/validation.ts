import type { NextRequest } from "next/server";
import * as yup from "yup";

export type YupValidationError = {
  error?: string;
  status?: number;
};

export type PreValidator = (
  raw: unknown
) => YupValidationError | void | Promise<YupValidationError | void>;

export type ExtraValidator<T> = (
  data: T
) => YupValidationError | void | Promise<YupValidationError | void>;

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
): Promise<T | YupValidationError> => {
  const body = await request.clone().json();

  return validateObject(body, schema, options, validators);
};

export const validateObject = async <
  Schema extends yup.AnyObjectSchema,
  T = yup.InferType<Schema>,
>(
  obj: unknown,
  schema: Schema,
  options?: yup.ValidateOptions,
  validators?: {
    pre?: PreValidator;
    post?: ExtraValidator<T>;
  }
): Promise<T | YupValidationError> => {
  let validated: T;

  if (validators?.pre) {
    const extraResult = await validators.pre(obj);
    if (extraResult && "error" in extraResult) {
      return extraResult;
    }
  }

  try {
    validated = await schema.validate(obj, options);
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

export const isYupValidationError = (
  result: unknown
): result is YupValidationError => {
  return (
    typeof result === "object" &&
    result !== null &&
    "error" in result &&
    "status" in result
  );
};
