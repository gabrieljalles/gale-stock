// A foto de perfil só preenche círculos pequenos (32px no header, 80px na
// conta). Guardar o original de 4000x3000 e 6MB seria desperdício de banda
// e de armazenamento em troca de nenhum pixel visível, então a imagem é
// reduzida no navegador ANTES de subir.

// 256px cobre com folga o maior círculo (80px) mesmo em telas de alta
// densidade (2x = 160px), com margem pra crescer o avatar no futuro.
const TARGET_SIZE = 256;
const JPEG_QUALITY = 0.82;

export interface ResizedImage {
  file: File;
  originalBytes: number;
  resizedBytes: number;
}

// Recorta o centro da imagem num quadrado e reduz pra TARGET_SIZE.
// Aceita qualquer proporção: o corte central é o que melhor preserva um
// rosto, que é o assunto de praticamente toda foto de perfil.
export const resizeProfileImage = (file: File): Promise<ResizedImage> =>
  new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("O arquivo escolhido não é uma imagem."));
      return;
    }

    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement("canvas");
      canvas.width = TARGET_SIZE;
      canvas.height = TARGET_SIZE;

      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Não foi possível processar a imagem."));
        return;
      }

      // Lado do maior quadrado que cabe na imagem, centralizado.
      const side = Math.min(image.width, image.height);
      const sourceX = (image.width - side) / 2;
      const sourceY = (image.height - side) / 2;

      context.imageSmoothingQuality = "high";
      context.drawImage(
        image,
        sourceX,
        sourceY,
        side,
        side,
        0,
        0,
        TARGET_SIZE,
        TARGET_SIZE,
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Não foi possível processar a imagem."));
            return;
          }

          resolve({
            // Sempre JPEG: PNG de foto costuma sair maior sem ganho visual.
            file: new File([blob], "avatar.jpg", { type: "image/jpeg" }),
            originalBytes: file.size,
            resizedBytes: blob.size,
          });
        },
        "image/jpeg",
        JPEG_QUALITY,
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível abrir a imagem."));
    };

    image.src = url;
  });
