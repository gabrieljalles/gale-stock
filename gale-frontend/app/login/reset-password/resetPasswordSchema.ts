import { z } from "zod";

export const resetPasswordKeySchema = z
  .object({
    newPassword: z.string().min(6, "Mínimo 6 caracteres"),
    confirmPassword: z.string().min(6, "Mínimo 6 caracteres"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Senhas não conferem",
    path: ["confirmPassword"],
  });
