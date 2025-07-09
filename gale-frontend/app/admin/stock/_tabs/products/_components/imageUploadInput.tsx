// ImageUploadInput.tsx
"use client";
import { UploadButton } from "@/_utils/uploadthing";
import { useState } from "react";
import { useFormContext } from "react-hook-form";

interface ImageUploadInputProps {
  value?: string;
  onChange?: (url: string) => void;
}

const ImageUploadInput: React.FC<ImageUploadInputProps> = ({
  value: propValue,
  onChange: propOnChange,
}) => {
  const [isUploading, setIsUploading] = useState(false);
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
    <div className="flex w-full flex-col items-center justify-between gap-2">
      {imgUrl && (
        <div className="flex w-full items-center flex-col">
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
        onClientUploadComplete={(res) => {
          setIsUploading(false);
          if (res && res[0]) {

            handleChange(res[0].ufsUrl);
            setFileName(res[0].name);
          }
        }}
        onUploadError={(error: Error) => {
          setIsUploading(false);
          alert(`ERROR! ${error.message}`);
        }}
      />

      {errors.imgUrl && (
        <span className="text-xs text-red-500">
          {errors.imgUrl.message?.toString()}
        </span>
      )}
    </div>
  );
};

export default ImageUploadInput;
