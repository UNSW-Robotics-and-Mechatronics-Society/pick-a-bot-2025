// src/schemas/currentMatch.ts
import * as yup from "yup";

export const currentMatchDataSchema = yup.object({
  id: yup
    .string()
    .uuid("`id` must be a valid UUID")
    .required("`id` is required"),

  match_id: yup
    .string()
    .uuid("`match_id` must be a valid UUID")
    .required("`match_id` is required"),

  bot1: yup.string().trim().required("`bot1` is required"),
  bot2: yup.string().trim().required("`bot2` is required"),

  winner: yup.string().trim().nullable().notRequired(),

  score_bot1: yup
    .number()
    .typeError("`score_bot1` must be a number")
    .integer("`score_bot1` must be an integer")
    .min(0, "`score_bot1` cannot be negative")
    .required("`score_bot1` is required"),

  score_bot2: yup
    .number()
    .typeError("`score_bot2` must be a number")
    .integer("`score_bot2` must be an integer")
    .min(0, "`score_bot2` cannot be negative")
    .required("`score_bot2` is required"),

  round: yup
    .number()
    .typeError("`round` must be a number")
    .integer("`round` must be an integer")
    .min(1, "`round` must be at least 1")
    .required("`round` is required"),

  state: yup
    .string()
    .oneOf(["open"], "`state` must be open")
    .required("`state` is required"),

  underway_time: yup
    .date()
    .typeError("`underway_time` must be a valid date")
    .nullable()
    .notRequired(),

  updated_time: yup
    .date()
    .typeError("`updated_time` must be a valid date")
    .required("`updated_time` is required"),

  ordering: yup
    .number()
    .typeError("`ordering` must be a number")
    .integer("`ordering` must be an integer")
    .min(0, "`ordering` cannot be negative")
    .required("`ordering` is required"),

  tournament_id: yup.string().trim().required("`tournament_id` is required"),

  is_final: yup
    .boolean()
    .typeError("`is_final` must be a boolean")
    .required("`is_final` is required"),
});

export type CurrentMatchData = yup.InferType<typeof currentMatchDataSchema>;
