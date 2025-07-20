import * as yup from "yup";

export const voteRequestSchema = yup.object({
  matchId: yup
    .string()
    .typeError("`matchId` must be a string")
    .required("`matchId` is required"),
  botChosen: yup.string().trim().required("`botChosen` is required"),
  amount: yup
    .number()
    .typeError("`amount` must be a number")
    .integer("`amount` must be an integer")
    .min(1, "`amount` must be at least 1")
    .required("`amount` is required"),
});

export type VoteFormData = yup.InferType<typeof voteRequestSchema>;
