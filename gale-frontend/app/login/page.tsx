"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "../login/loginSchema";
import { z } from "zod";
import { Input } from "@/_components/ui/input";
import { Button } from "@/_components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Mail, Lock } from "lucide-react";
import LogoComponent from "@/_components/LogoComponent";

type LoginFormInputs = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormInputs) => {
    console.log("Dados de login:", data);
    // Aqui você pode chamar sua função de login
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-secondary">
      <div className="flex h-[400px] w-[375px] flex-col justify-center rounded-2xl bg-white px-6 shadow-lg">
        <LogoComponent />
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
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
            <label className="mb-1 block text-sm font-medium">Senha</label>
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
              Não possui conta?{" "}
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
    </div>
  );
};

export default LoginPage;
