import { z } from "zod";
import { resetPasswordSchema } from "../loginSchema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/_components/ui/dialog";
import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

interface ForgetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (email: string) => Promise<void>;
}

const ForgetPasswordDialog = ({
  open,
  onOpenChange,
  onSend,
}: ForgetPasswordDialogProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordForm) => {
    await onSend(data.email);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Esqueci minha senha</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              E-mail cadastrado
            </label>
            <Input
              id="email"
              type="email"
              placeholder="digite seu e-mail cadastrado..."
              autoFocus
              {...register("email")}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="submit"
              variant="outline"
              className="hover:bg-green-600 hover:text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Enviando..." : "Enviar E-mail de reset"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ForgetPasswordDialog;
