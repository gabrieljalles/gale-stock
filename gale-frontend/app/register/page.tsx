"use client";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "@/register/registerSchema";
import { z } from "zod";
import { Input } from "@/_components/ui/input";
import { Button } from "@/_components/ui/button";
import Link from "next/link";
import { validateCpfCnpj } from "@/_utils/validate-cpf-cnpj";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "@/_components/ui/dialog";
import TermsOfUse from "@/_components/termOfUse";
import { DialogTitle } from "@radix-ui/react-dialog";
import LogoComponent from "@/_components/LogoComponent";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/_components/ui/select";
import { DatePicker } from "@/_components/DatePicker";
import { Calendar } from "@/_components/ui/calendar";

type RegisterFormInputs = z.infer<typeof registerSchema>;

const RegisterPage: React.FC = () => {
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  const cpfCnpjValue = watch("cpfCnpj") || "";
  const isCpfCnpjValid = validateCpfCnpj(cpfCnpjValue);

  const onSubmit = (data: RegisterFormInputs) => {
    console.log("Dados de registro:", data);
  };

  const [showTerms, setShowTerms] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [date, setDate] = React.useState<Date>();

  return (
    <div className="flex h-screen w-full items-center justify-center bg-secondary">
      <div className="flex w-[375px] flex-col justify-center rounded-2xl bg-white p-6 shadow-lg">
        <LogoComponent />
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
          {/* Email */}
          <div>
            <label className="mb-0.5 block text-[12px] font-medium">
              Email
            </label>
            <Input
              type="email"
              placeholder="you@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="mt-0.5 text-xs text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* CPF/CNPJ */}
          <div>
            <label className="mb-0.5block text-[12px] font-medium">
              CPF/CNPJ
            </label>
            <Input
              type="text"
              placeholder="000.000.000-00 / 00.000.000/0000-00"
              className={`rounded border p-2 ${
                errors.cpfCnpj
                  ? "border-red-500"
                  : cpfCnpjValue && isCpfCnpjValid
                    ? "border-green-500"
                    : "border-gray-300"
              }`}
              {...register("cpfCnpj")}
            />
            {errors.cpfCnpj && (
              <p className="mb-0.5 text-xs text-red-500">
                {errors.cpfCnpj.message}
              </p>
            )}
          </div>

          {/* Nome Completo */}
          <div>
            <label className="mb-0.5 block text-[12px] font-medium">
              Nome completo
            </label>
            <Input
              type="text"
              placeholder="Seu nome"
              {...register("fullName")}
            />
            {errors.fullName && (
              <p className="mb-0.5 text-xs text-red-500">
                {errors.fullName.message}
              </p>
            )}
          </div>

          {/*Data de nascimento*/}
          <div>
            <label className="mb-0.5 block text-[12px] font-medium">
              Data de Nascimento
            </label>
            <Input
              type="date"
              id="dateOfBirth"
              {...register("dateOfBirth")}
              className="w-full rounded border border-gray-300 p-2 text-sm focus:border-primary focus:ring-primary"
            />
            {errors.dateOfBirth && (
              <p className="mb-0.5 text-xs text-red-500">
                {errors.dateOfBirth.message}
              </p>
            )}
          </div>

          {/* Genero */}
          <div>
            <label className="mb-0.5 block text-[12px] font-medium">
              Gênero
            </label>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger className="text-muted-foreground w-full">
                    <SelectValue
                      placeholder="Informe seu gênero"
                      className="text-muted-foreground"
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="Masculine" className="cursor-pointer">
                      Masculino
                    </SelectItem>
                    <SelectItem value="Feminine" className="cursor-pointer">
                      Feminino
                    </SelectItem>
                    <SelectItem value="Other" className="cursor-pointer">
                      Outros
                    </SelectItem>
                    <SelectItem value="DoNotInform" className="cursor-pointer">
                      Não informar
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.gender && (
              <p className="mb-0.5 text-xs text-red-500">
                {errors.gender.message}
              </p>
            )}
          </div>

          {/* Telefone */}
          <div>
            <label className="mb-0.5 block text-[12px] font-medium">
              Telefone para contato
            </label>
            <Input
              type="text"
              placeholder="(34) 99999-9999"
              {...register("phone")}
            />
            {errors.phone && (
              <p className="mb-0.5 text-xs text-red-500">
                {errors.phone.message}
              </p>
            )}
          </div>

          {/* Senha */}
          <div>
            <label className="mb-0.5 block text-[12px] font-medium">
              Senha
            </label>
            <Input
              type="password"
              placeholder="Sua senha"
              {...register("password")}
            />
            {errors.password && (
              <p className="mt-0.5 text-xs text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Repetir Senha */}
          <div>
            <Input
              type="password"
              placeholder="Repita sua senha"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="mt-0.5 text-xs text-red-500">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Botão para abrir termos */}
          <Dialog open={showTerms} onOpenChange={setShowTerms}>
            <DialogTrigger asChild>
              <Button
                variant="link"
                className={`w-full text-[12px] underline hover:text-secondary ${acceptedTerms ? "text-green-500" : "text-black"}`}
              >
                <Input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={() => {
                    if (!acceptedTerms) {
                      setShowTerms(true);
                    } else {
                      setAcceptedTerms(false);
                    }
                  }}
                  className={`rounde4 h-3 w-3 border-2 border-black accent-green-500 hover:border-secondary focus:ring-primary`}
                />
                Aceite os termos de uso
              </Button>
            </DialogTrigger>

            {/* Fazemos o container flex para distribuir header, body e footer */}
            <DialogContent className="flex max-h-[88vh] w-full flex-col px-6">
              <DialogHeader className="flex items-center justify-center">
                <DialogTitle className="text-lg font-medium">
                  Termos de uso
                </DialogTitle>
              </DialogHeader>

              {/* Div scrollável que ocupa o espaço restante */}
              <div className="flex-1 overflow-y-auto px-0">
                <TermsOfUse />
              </div>

              <DialogFooter className="flex justify-end space-x-2">
                {/* Fecha sem aceitar */}
                <DialogClose asChild>
                  <Button
                    variant="outline"
                    className="hover:bg-red-500 hover:text-white"
                  >
                    Sair
                  </Button>
                </DialogClose>

                {/* Aceita e fecha */}
                <DialogClose asChild>
                  <Button
                    variant="default"
                    onClick={() => setAcceptedTerms(true)}
                    className="text-white hover:bg-green-500"
                  >
                    Concordar
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Submit só se termos aceitos */}
          <Button
            type="submit"
            className="mt-12 w-full text-white hover:bg-secondary hover:text-primary"
            disabled={isSubmitting || !acceptedTerms}
          >
            Registrar
          </Button>

          {/* Volta para o login */}
          <div className="mt-8 text-center font-extralight">
            <span className="text-sm font-thin text-gray-500">
              Já possui conta?{" "}
              <Button asChild className="bg-transparent p-0">
                <Link
                  href="/login"
                  className="transform font-extralight text-primary transition-transform duration-200 hover:scale-105 hover:text-green-500"
                >
                  Logue aqui
                </Link>
              </Button>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
