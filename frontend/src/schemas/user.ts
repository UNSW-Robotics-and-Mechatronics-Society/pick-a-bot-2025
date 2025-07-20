import * as yup from "yup";

export const userDataSchema = yup.object({
  id: yup
    .string()
    .uuid("`id` must be a valid UUID")
    .required("`id` is required"),
  name: yup.string().trim().required("`name` is required"),
  email: yup
    .string()
    .email("`email` must be a valid email")
    .required("`email` is required"),
  tokens: yup
    .number()
    .typeError("`tokens` must be a number")
    .integer("`tokens` must be an integer")
    .min(0, "`tokens` cannot be negative")
    .required("`tokens` is required"),
  created_at: yup
    .date()
    .typeError("`created_at` must be a valid date")
    .required("`created_at` is required"),
});

export type UserData = yup.InferType<typeof userDataSchema>;
