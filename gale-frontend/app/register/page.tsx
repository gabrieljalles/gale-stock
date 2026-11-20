"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "@/register/registerSchema";
import { z } from "zod";
import { Input } from "@/_components/ui/input";
import { Button } from "@/_components/ui/button";
import Link from "next/link";
import { validateCpfCNPJ } from "@/_utils/validate-cpf-cnpj";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "@/_components/ui/dialog";
import TermsOfUse from "@/_components/termsOfUse";
import { DialogTitle } from "@radix-ui/react-dialog";
import LogoComponent from "@/_components/LogoComponent";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/_components/ui/select";
import {
  register as apiRegister,
  resendEmail as apiResendEmail,
} from "@/api/auth";
import { formatPhone } from "@/_utils/format-phone";
import { formatCpfCNPJ } from "@/_utils/format-cpf-cnpj";
import TermsDialog from "./_components/terms-dialog";
import RegistrationSuccessDialog from "./_components/success-registration-dialog";
import { IterationCw, Share2 } from "lucide-react";
import axios from "axios";
import { describeReferralCode } from "@/api/points";

type RegisterFormInputs = z.infer<typeof registerSchema>;

const RegisterForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    watch,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  const cpfCNPJValue = watch("cpfCNPJ") || "";
  const isCpfCNPJValid = validateCpfCNPJ(cpfCNPJValue);

  const [showTerms, setShowTerms] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);
  const [createdEmail, setCreatedEmail] = useState("");

  const [loading, setLoading] = useState(false);

  // Vínculo de indicação: o código vem na URL e acompanha o cadastro. Ele
  // é gravado uma vez e nunca mais muda — é o que define quem recebe
  // pontos da rede dessa pessoa.
  const referralCode = useSearchParams().get("ref")?.trim() || null;
  const [sponsorName, setSponsorName] = useState<string | null>(null);

  useEffect(() => {
    if (!referralCode) return;
    describeReferralCode(referralCode)
      .then((sponsor) => setSponsorName(sponsor?.firstName ?? null))
      // Código inválido não trava nada: o cadastro segue sem vínculo.
      .catch(() => setSponsorName(null));
  }, [referralCode]);

  const onSubmit = async (data: RegisterFormInputs) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        dateOfBirth: new Date(data.dateOfBirth).toISOString(),
        ...(referralCode ? { referralCode } : {}),
      };

      const response = await apiRegister(payload);
      if (response.user) {
        setCreatedEmail(response.user.email);
        setShowSuccess(true);
      } else {
        console.error("Erro no cadastro:", response.error);
      }
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        const msg: string = err.response.data.message;
        setError("email", { type: "manual", message: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (email: string) => {
    try {
      await apiResendEmail(email);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    // min-h-screen (e não h-screen): o container cresce junto com o
    // formulário em vez de cortá-lo. Com altura fixa + items-center, um
    // cartão mais alto que a tela tem o topo empurrado pra fora da
    // viewport, e não há como rolar até ele.
    <div className="flex min-h-screen w-full items-center justify-center bg-secondary px-4 py-4">
      <div className="flex w-full max-w-[400px] flex-col justify-center rounded-2xl bg-white p-3 shadow-lg">
        <LogoComponent size={40} />

        {referralCode && (
          <div className="mb-2 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-2.5">
            <Share2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
            <p className="text-[11px] leading-snug text-amber-900">
              {sponsorName ? (
                <>
                  <strong>{sponsorName}</strong> te convidou para o Galé.
                </>
              ) : (
                <>Você chegou por um convite.</>
              )}{" "}
              Criando sua conta por aqui, vocês dois passam a{" "}
              <strong>acumular pontos</strong> nas compras.{" "}
              <Link href="/pontos" target="_blank" className="underline">
                Como funciona
              </Link>
            </p>
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          // Campos e respiro reduzidos só neste formulário: são 8 campos
          // e o objetivo é caber na tela sem rolagem. Mexer no componente
          // Input (h-9 padrão) afetaria todas as telas do sistema.
          // O gênero é um Select, não um input, por isso a segunda regra.
          className="space-y-1.5 [&_input]:h-7 [&_input]:text-xs [&_[data-slot=select-trigger]]:h-7 [&_[data-slot=select-trigger]]:text-xs"
        >
          {/* Email */}
          <div>
            <label className="mb-0 block text-[11px] font-medium">
              Email
            </label>
            <Input
              type="email"
              placeholder="you@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="mt-0.5 text-[11px] text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* CPF/CNPJ */}
          <div>
            <label className="mb-0 block text-[11px] font-medium">
              CPF/CNPJ{" "}
              <span className="text-[10px] text-gray-500">*Apenas números</span>
            </label>
            <Controller
              name="cpfCNPJ"
              control={control}
              render={({ field }) => (
                <Input
                  type="text"
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  value={field.value ?? ""}
                  onChange={(e) => {
                    // aplica a máscara conforme digita
                    const masked = formatCpfCNPJ(e.target.value);
                    field.onChange(masked);
                  }}
                  className={`rounded border p-2 ${
                    errors.cpfCNPJ
                      ? "border-red-500"
                      : cpfCNPJValue && isCpfCNPJValid
                        ? "border-green-500"
                        : "border-gray-300"
                  }`}
                />
              )}
            />
            {errors.cpfCNPJ && (
              <p className="mb-0.5 text-[11px] text-red-500">
                {errors.cpfCNPJ.message}
              </p>
            )}
          </div>

          {/* Nome Completo */}
          <div>
            <label className="mb-0 block text-[11px] font-medium">
              Nome completo
            </label>
            <Input
              type="text"
              placeholder="Seu nome"
              {...register("fullName")}
            />
            {errors.fullName && (
              <p className="mb-0.5 text-[11px] text-red-500">
                {errors.fullName.message}
              </p>
            )}
          </div>

          {/*Data de nascimento*/}
          <div>
            <label className="mb-0 block text-[11px] font-medium">
              Data de Nascimento
            </label>
            <Input
              type="date"
              id="dateOfBirth"
              {...register("dateOfBirth")}
              className="w-full rounded border border-gray-300 p-2 text-sm focus:border-primary focus:ring-primary"
            />
            {errors.dateOfBirth && (
              <p className="mb-0.5 text-[11px] text-red-500">
                {errors.dateOfBirth.message}
              </p>
            )}
          </div>

          {/* Genero */}
          <div>
            <label className="mb-0 block text-[11px] font-medium">
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
              <p className="mb-0.5 text-[11px] text-red-500">
                {errors.gender.message}
              </p>
            )}
          </div>

          {/* Telefone */}
          <div>
            <label className="mb-0 block text-[11px] font-medium">
              Telefone para contato
            </label>
            <Controller
              name="cellPhone"
              control={control}
              render={({ field }) => (
                <Input
                  type="text"
                  placeholder="(34) 99999-9999"
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const masked = formatPhone(e.target.value);
                    field.onChange(masked);
                  }}
                  className="w-full rounded border border-gray-300 p-2 text-sm focus:border-primary focus:ring-primary"
                />
              )}
            />
            {errors.cellPhone && (
              <p className="mb-0.5 text-[11px] text-red-500">
                {errors.cellPhone.message}
              </p>
            )}
          </div>

          {/* Senha */}
          <div>
            <label className="mb-0 block text-[11px] font-medium">
              Senha
            </label>
            <Input
              type="password"
              placeholder="Sua senha"
              {...register("password")}
            />
            {errors.password && (
              <p className="mt-0.5 text-[11px] text-red-500">
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
              <p className="mt-0.5 text-[11px] text-red-500">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Botão para abrir termos */}
          <TermsDialog
            open={showTerms}
            onOpenChange={setShowTerms}
            accepted={acceptedTerms}
            onAcceptedChange={setAcceptedTerms}
            triggerLabel="Aceite os termos de uso"
            title="Termos de uso"
          >
            <TermsOfUse />
          </TermsDialog>

          {/* Submit só se termos aceitos */}
          <Button
            type="submit"
            className="mt-3 h-8 w-full text-white hover:bg-secondary hover:text-primary"
            disabled={isSubmitting || !acceptedTerms}
          >
            {loading ? <IterationCw className="animate-spin" /> : "Registrar"}
          </Button>

          {/* Popup de sucesso*/}
          <RegistrationSuccessDialog
            open={showSuccess}
            onOpenChange={setShowSuccess}
            email={createdEmail}
            onResend={handleResend}
          />

          {/* Volta para o login */}
          <div className="mt-3 text-center font-extralight">
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

/**
 * useSearchParams exige uma fronteira de Suspense pra página não perder a
 * renderização estática — o convite chega pela URL, então não há como
 * fugir do hook aqui.
 */
const RegisterPage: React.FC = () => (
  <Suspense fallback={null}>
    <RegisterForm />
  </Suspense>
);

export default RegisterPage;
