"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { resetPasswordKeySchema } from "./resetPasswordSchema";
import { z } from "zod";
import { updatePassword as ApiUpdatePassword } from "@/api/auth";
import { Input } from "@/_components/ui/input";
import { Button } from "@/_components/ui/button";

type ResetForm = z.infer<typeof resetPasswordKeySchema>;

const ResetPasswordPage = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      toast.error("Link inválido ou expirado.");
      router.replace("/login");
    }
  }, [token, router, toast]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetPasswordKeySchema),
  });

  const onSubmit = async (data: ResetForm) => {
    try {
      await ApiUpdatePassword({
        token: token!,
        newPassword: data.newPassword,
      });
      toast.success("Senha redefinida!", {
        description: "Senha alterada com sucesso. Faça seu login",
      });
      router.replace("/login");
    } catch {
      toast.error("Falha ao redefinir senha.");
    }
  };

  if (!token) return null;

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm space-y-3 rounded bg-white p-6 shadow-md"
      >
        <h3 className="text-center text-xl font-semibold">Redefinir senha</h3>

        <div>
          <label
            htmlFor="newPassword"
            className="block text-[12px] font-medium text-gray-700"
          >
            Nova senha
          </label>
          <Input
            id="newPassword"
            type="password"
            {...register("newPassword")}
            placeholder="********"
          />
          {errors.newPassword && (
            <p className="mt-1 text-xs text-red-500">
              {errors.newPassword.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-[12px] font-medium text-gray-700"
          >
            Repetir nova senha
          </label>
          <Input
            id="confirmPassword"
            type="password"
            {...register("confirmPassword")}
            placeholder="********"
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-500">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          variant="outline"
          className="w-full text-primary hover:bg-green-600 hover:text-white"
        >
          {isSubmitting ? "Redefinindo..." : "Redefinir senha"}
        </Button>
      </form>
    </div>
  );
};

export default ResetPasswordPage;
