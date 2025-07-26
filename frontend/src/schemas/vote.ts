import * as yup from "yup";

export const voteRequestSchema = yup.object({
  matchId: yup
    .string()
    .typeError("`matchId` must be a string")
    .required("`matchId` is required"),
  botChosen: yup.string().required("Please select a bot"),
  amount: yup
    .number()
    .required("Amount is required")
    .positive("Amount must be a positive number")
    .integer("Amount must be a whole number")
    .min(1, "Minimum vote is 1 token"),
});

export type VoteFormData = yup.InferType<typeof voteRequestSchema>;
