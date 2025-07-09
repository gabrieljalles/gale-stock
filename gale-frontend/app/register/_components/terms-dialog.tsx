import TermsOfUse from "@/_components/termsOfUse";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/_components/ui/dialog";
import { Input } from "@/_components/ui/input";
import { ReactNode } from "react";
import { Button } from "@/_components/ui/button";

interface TermsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accepted: boolean;
  onAcceptedChange: (accepted: boolean) => void;
  triggerLabel?: string;
  title?: string;
  children: ReactNode;
}

const TermsDialog = ({
  open,
  onOpenChange,
  accepted,
  onAcceptedChange,
  triggerLabel = "Aceite os termos de uso e político",
  title = "Termos de uso",
  children,
}: TermsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="link"
          className={`w-full text-[12px] underline hover:text-secondary ${
            accepted ? "text-green-500" : "text-black"
          }`}
        >
          <Input
            type="checkbox"
            checked={accepted}
            onChange={() => {
              if (!accepted) {
                onOpenChange(true);
              } else {
                onAcceptedChange(false);
              }
            }}
            className={`h-3 w-3 rounded border-2 border-black accent-green-500 hover:border-secondary focus:ring-primary`}
          />
          {triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[88vh] w-full flex-col px-6">
        <DialogHeader className="flex items-center justify-center">
          <DialogTitle className="text-lg font-medium">{title}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-0">{children}</div>

        <DialogFooter className="flex justify-end space-x-2">
          <DialogClose asChild>
            <Button
              variant="outline"
              className="hover:bg-red-500 hover:text-white"
            >
              Sair
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              variant="default"
              onClick={() => onAcceptedChange(true)}
              className="text-white hover:bg-green-500"
            >
              Concordar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TermsDialog;
