"use client";
import { UploadButton } from "@/_utils/uploadthing";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { validateSquareImage } from "@/_utils/image-validation";

interface ImageUploadInputProps {
  value?: string;
  onChange?: (url: string) => void;
}

const ImageUploadInput: React.FC<ImageUploadInputProps> = ({
  value: propValue,
  onChange: propOnChange,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const {
    setValue: contextSetValue,
    watch,
    formState: { errors },
  } = useFormContext();
  const [fileName, setFileName] = useState<string | null>(null);

  const imgUrl = propValue ?? watch("imgUrl");

  const handleChange = (url: string) => {
    if (propOnChange) {
      propOnChange(url);
    } else {
      contextSetValue("imgUrl", url, { shouldValidate: true });
    }
  };

  return (
    <div className="flex w-full flex-col items-center justify-between gap-1">
      {imgUrl && (
        <div className="flex w-full flex-col items-center">
          <label className="text-xs">{fileName}</label>
          <img src={imgUrl} alt="preview" className="h-16 rounded" />
        </div>
      )}

      <UploadButton
        endpoint="imageUploader"
        appearance={{
          button: {
            background: "#131e33",
            padding: "1rem",
            color: "#fff",
          },
          container: {
            display: "flex",
          },
        }}
        onBeforeUploadBegin={async (files) => {
          setIsValidating(true);

          // Validar cada arquivo antes do upload
          for (const file of files) {
            const isSquare = await validateSquareImage(file);
            if (!isSquare) {
              setIsValidating(false);
              alert(
                `❌ A imagem "${file.name}" deve ser quadrada!\n\nEnvie uma imagem com a mesma largura e altura (ex: 512x512px)`,
              );
              return []; // Cancelar upload
            }
          }

          setIsValidating(false);
          setIsUploading(true);
          return files; // Prosseguir com upload
        }}
        onClientUploadComplete={(res) => {
          setIsUploading(false);
          if (res && res[0]) {
            handleChange(res[0].url);
            setFileName(res[0].name);
          }
        }}
        onUploadError={(error: Error) => {
          setIsUploading(false);
          setIsValidating(false);
          alert(`❌ ERRO! ${error.message}`);
        }}
      />

      <span className="text-center text-[10px] text-gray-500">
        📐 Sempre faça upload de imagens quadradas
        <br />
        <span className="text-gray-400">(mesma largura e altura)</span>
      </span>

      {isValidating && (
        <span className="text-xs text-orange-500">
          🔍 Verificando se a imagem é quadrada...
        </span>
      )}

      {isUploading && (
        <span className="text-xs text-blue-500">
          ⬆️ Fazendo upload da imagem...
        </span>
      )}

      {errors.imgUrl && (
        <span className="text-xs text-red-500">
          {errors.imgUrl.message?.toString()}
        </span>
      )}
    </div>
  );
};

export default ImageUploadInput;
