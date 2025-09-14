/**
 * Valida se uma imagem é quadrada (largura === altura)
 * @param file - Arquivo de imagem para validar
 * @returns Promise<boolean> - true se a imagem for quadrada, false caso contrário
 */
export const validateSquareImage = (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    // Verificar se é um arquivo de imagem
    if (!file.type.startsWith("image/")) {
      resolve(false);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url); // Limpar memoria
      const isSquare = img.width === img.height;
      console.log(
        `📐 Imagem ${file.name}: ${img.width}x${img.height} - ${isSquare ? "Quadrada ✅" : "Não quadrada ❌"}`,
      );
      resolve(isSquare);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      console.error(`❌ Erro ao carregar imagem: ${file.name}`);
      resolve(false);
    };

    img.src = url;
  });
};
