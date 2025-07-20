import * as yup from "yup";

const BANNED_NAMES = [
  "admin",
  "root",
  "superuser",
  "staff",
  "ramsoc",
  "pick-a-bot",
  "pickabot",
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "cunt",
  "motherfucker",
  "fucker",
  "cocksucker",
  "dickhead",
  "pussy",
  "bastard",
  "dick",
];

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
        return !BANNED_NAMES.some((bad) => lower.includes(bad));
      }
    ),
  email: yup
    .string()
    .email("Email must be valid")
    .required("Email is required"),
});

export type JoinFormData = yup.InferType<typeof joinSchema>;
