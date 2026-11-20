import {
  generateReactHelpers,
  generateUploadButton,
  generateUploadDropzone,
} from "@uploadthing/react";

import type { OurFileRouter } from "@/api/uploadthing/core";

export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();

// uploadFiles: envio manual, usado quando o arquivo é gerado em código
// (ex: a foto de perfil, que é redimensionada antes de subir) e não vem
// direto de um <input> do componente pronto.
export const { uploadFiles } = generateReactHelpers<OurFileRouter>();
