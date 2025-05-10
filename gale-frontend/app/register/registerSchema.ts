import { z } from "zod";
import { validateCpfCnpj } from "@/_utils/validate-cpf-cnpj";

function calculateAge(dateString: string): number {
  const birthDate = new Date(dateString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }
  return age;
}

export const registerSchema = z
  .object({
    gender: z.enum(["Masculine", "Feminine", "Other", "DoNotInform"], {
      errorMap: () => ({
        message: "Você precisa escolher uma opção de gênero.",
      }),
    }),
    dateOfBirth: z.string().refine(
      (date) => {
        const age = calculateAge(date);
        return age >= 18;
      },
      {
        message: "Você precisa ter pelo menos 18 anos.",
      },
    ),
    fullName: z.string().min(1, { message: "Nome completo é obrigatório." }),
    phone: z.string().regex(/^\(\d{2}\)\s?\d{4,5}-\d{4}$/, {
      message: "Digite um telefone válido.",
    }),
    email: z.string().email({ message: "Digite um email válido." }),
    cpfCnpj: z.string().refine((value) => validateCpfCnpj(value), {
      message: "CPF/CNPJ inválido.",
    }),
    password: z
      .string()
      .min(6, { message: "A senha deve ter no mínimo 6 dígitos." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem.",
    path: ["confirmPassword"],
  });
