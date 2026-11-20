"use client";
import React, { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "../login/loginSchema";
import { z } from "zod";
import { Input } from "@/_components/ui/input";
import { Button } from "@/_components/ui/button";
import { Mail, Lock } from "lucide-react";
import LogoComponent from "@/_components/LogoComponent";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import ForgetPasswordDialog from "./_components/forget-password-dialog";
import { sendPasswordResetEmail } from "@/api/auth";
import Link from "next/link";
import { AuthContext } from "@/_store/auth/AuthContext";

type LoginFormInputs = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const [showDialog, setShowDialog] = useState(false);
  const { signin } = useContext(AuthContext);
  const searchParams = useSearchParams();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  //Mostra um toast se o usuário acabou de verificar o E-MAIL.
  useEffect(() => {
    const verified = searchParams.get("verified");
    if (verified === "1") {
      toast.success("E-mail confirmado!", {
        description: "Seja muito bem vindo a família Galé.",
      });
      router.replace("/login", { scroll: false });
    }
  }, [searchParams, router, toast]);

  //Efetuar login
  const onSubmit = async (data: LoginFormInputs) => {
    try {
      const loggedUser = await signin(data.email, data.password);
      toast.success("Logado com sucesso!");

      // Veio de uma tela específica (ex: carrinho -> checkout)? Volta pra
      // lá. Senão, cada papel cai onde faz sentido: equipe no painel,
      // cliente na loja.
      const redirect = searchParams.get("redirect");
      if (redirect?.startsWith("/")) {
        router.push(redirect);
      } else if (["Admin", "Shopper"].includes(loggedUser.role)) {
        router.push("/admin/resume");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || err.message || "Falha de login",
      );
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-secondary">
      <div className="flex h-[400px] w-[375px] flex-col justify-center rounded-2xl bg-white px-6 shadow-lg">
        <LogoComponent />
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-0 block text-sm font-medium">Email</label>
            <div className="relative">
              <Mail
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400"
              />

              <Input
                type="email"
                className="pl-10"
                placeholder="digite seu email"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>
          <div>
            <label className="mb-0 block text-sm font-medium">Senha</label>
            <div className="relative">
              <Lock
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400"
              />
              <Input
                type="password"
                className="pl-10"
                placeholder="Digite sua senha"
                {...register("password")}
              />
            </div>

            {errors.password && (
              <p className="mt-1 text-xs text-red-500">
                {errors.password.message}
              </p>
            )}
            <div className="flex justify-end p-0">
              <Button
                type="button"
                onClick={() => setShowDialog(true)}
                className="bg-transparent p-0 text-[12px] text-primary hover:text-red-500"
              >
                Esqueci minha senha!
              </Button>
            </div>
          </div>
          <Button
            type="submit"
            className="w-full transform bg-primary text-white transition-transform duration-200 hover:bg-secondary hover:text-primary"
            disabled={isSubmitting}
          >
            Entrar
          </Button>
          <div className="mt-4 text-center font-extralight">
            <span className="text-sm font-thin text-gray-500">
              Não possui conta?{"  "}
              <Button asChild className="bg-transparent p-0">
                <Link
                  href="/register"
                  className="transform font-extralight text-primary transition-transform duration-200 hover:scale-105 hover:text-red-500"
                >
                  Registre aqui
                </Link>
              </Button>
            </span>
          </div>
        </form>
      </div>

      <ForgetPasswordDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onSend={async (email) => {
          await sendPasswordResetEmail(email);
          toast.success("E-mail de mudança de senha enviado", {
            unstyled: true,
            className:
              "bg-green-500 gap-2 flex flex-start rounded-md items-center px-4 py-3 text-white",
            description: "Visite seu e-mail e troque sua senha.",
          });
          router.replace("/login", { scroll: false });
          setShowDialog(false);
        }}
      />
    </div>
  );
};

export default LoginPage;
