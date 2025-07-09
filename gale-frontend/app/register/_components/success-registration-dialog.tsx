import { Button } from "@/_components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/_components/ui/dialog";
import { SquareCheck } from "lucide-react";
import { useEffect, useState } from "react";

export interface RegistrationSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  onResend: (email: string) => void;
}

const RegistrationSuccessDialog = ({
  open,
  onOpenChange,
  email,
  onResend,
}: RegistrationSuccessDialogProps) => {
  const [cooldown, setCooldown] = useState(0);
  const COOLDOWN_SECONDS = 60;

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleClickResend = () => {
    if (cooldown > 0) return;
    onResend(email);
    setCooldown(COOLDOWN_SECONDS);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-sm bg-white"
        aria-describedby="E-mail de verificação enviado."
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-extrabold text-green-600">
            <SquareCheck className="font-extrabold text-green-600" /> Usuário
            criado com sucesso!
          </DialogTitle>
        </DialogHeader>
        <div className="my-4 flex flex-col gap-1 text-black">
          <p className="text-justify">
            Confira seu e-mail <span className="font-bold">{email}</span>{" "}
            (inclusive Spam/Lixo) para ativar sua conta.
          </p>
        </div>
        <DialogFooter className="flex w-full items-center justify-center">
          <Button
            variant="outline"
            className={`hover:bg-green-600 hover:text-white ${cooldown > 0 ? "cursor-not-allowed opacity-50" : ""} `}
            onClick={handleClickResend}
            disabled={cooldown > 0}
          >
            {cooldown > 0
              ? `Reenviar em ${cooldown}s`
              : "Reenviar e-mail de verificação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RegistrationSuccessDialog;
