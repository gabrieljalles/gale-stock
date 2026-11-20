"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { uploadFiles } from "@/_utils/uploadthing";
import { resizeProfileImage } from "@/_utils/resize-image";
import { updateMyAvatar } from "@/api/user";

const formatKb = (bytes: number) => `${Math.round(bytes / 1024)} KB`;

interface AvatarUploaderProps {
  avatarUrl: string | null;
  fullName: string;
  onChange: (avatarUrl: string | null) => void;
}

const initialsOf = (fullName: string): string => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const AvatarUploader = ({
  avatarUrl,
  fullName,
  onChange,
}: AvatarUploaderProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    setBusy(true);
    try {
      // Reduz ANTES de subir: o que viaja pela rede já é a versão leve.
      const resized = await resizeProfileImage(file);

      const uploaded = await uploadFiles("imageUploader", {
        files: [resized.file],
      });
      const url = uploaded[0]?.ufsUrl ?? uploaded[0]?.url;
      if (!url) throw new Error("Upload não retornou a imagem.");

      await updateMyAvatar(url);
      onChange(url);

      toast.success(
        `Foto atualizada! (${formatKb(resized.originalBytes)} → ${formatKb(resized.resizedBytes)})`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao enviar a foto.",
      );
    } finally {
      setBusy(false);
      // Permite reenviar o mesmo arquivo depois de um erro.
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    setBusy(true);
    try {
      await updateMyAvatar(null);
      onChange(null);
      toast.success("Foto removida.");
    } catch {
      toast.error("Erro ao remover a foto.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-20 w-20 flex-shrink-0">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt="Sua foto de perfil"
            fill
            sizes="80px"
            className="rounded-full object-cover"
          />
        ) : (
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
            {initialsOf(fullName)}
          </span>
        )}

        {busy && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </span>
        )}
      </div>

      <div className="min-w-0">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-secondary hover:text-primary disabled:opacity-50"
          >
            <Camera className="h-3.5 w-3.5" />
            {avatarUrl ? "Trocar foto" : "Adicionar foto"}
          </button>

          {avatarUrl && (
            <button
              type="button"
              disabled={busy}
              onClick={handleRemove}
              className="flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs text-gray-600 hover:text-red-600 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remover
            </button>
          )}
        </div>

        <p className="mt-1.5 text-[11px] text-gray-400">
          Pode enviar qualquer tamanho — a imagem é recortada no centro e
          reduzida antes de subir.
        </p>
      </div>
    </div>
  );
};

export default AvatarUploader;
