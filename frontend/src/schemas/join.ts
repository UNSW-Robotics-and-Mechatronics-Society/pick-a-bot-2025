import BAD_WORDS from "@/data/bad-words.json";
import * as yup from "yup";

export const BANNED_WORDS = BAD_WORDS.concat(["ramsoc", "pick-a-bot", "admin"]);

export const joinSchema = yup.object({
  accessCode: yup.string().required("Access Code is required"),
  name: yup
    .string()
    .required("Display Name is required")
    .test(
      "no-sensitive-words",
      "Display Name contains prohibited words",
      (value) => {
        if (!value) return false;
        const lower = value.toLowerCase();
        return !BANNED_WORDS.some((bad) => lower.includes(bad));
      }
    ),
  email: yup
    .string()
    .email("Email must be valid")
    .required("Email is required"),
});

export type JoinFormData = yup.InferType<typeof joinSchema>;
