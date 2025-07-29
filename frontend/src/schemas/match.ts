// src/schemas/currentMatch.ts
import { Tables } from "@/types/database.types";
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

  winner: yup.string().trim().nullable().default(null),

  score_bot1: yup
    .number()
    .typeError("`score_bot1` must be a number")
    .integer("`score_bot1` must be an integer")
    .min(0, "`score_bot1` cannot be negative")
    .nullable()
    .default(0),

  score_bot2: yup
    .number()
    .typeError("`score_bot2` must be a number")
    .integer("`score_bot2` must be an integer")
    .min(0, "`score_bot2` cannot be negative")
    .nullable()
    .default(0),

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

  underway_time: yup.string().nullable().defined(),

  updated_time: yup
    .string()
    .nullable()
    .defined()
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
}) satisfies yup.ObjectSchema<Tables<"current_match">>;

export type CurrentMatchData = Tables<"current_match">;
