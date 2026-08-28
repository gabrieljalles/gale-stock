"use client";

import { useEffect, useState } from "react";
import { getSettings } from "@/api/settings";

// Indicador pequeno e discreto (bolinha verde/cinza) do status da loja,
// só pra lembrar o admin de abrir se ela estiver fechada. Sem clique,
// sem toast — quem quiser mudar o status vai em Configurações.
const StoreStatusDot = () => {
  const [storeOpen, setStoreOpen] = useState<boolean | null>(null);

  useEffect(() => {
    getSettings()
      .then((settings) => setStoreOpen(settings.storeOpen))
      .catch(() => {
        // Silencioso: se falhar, o indicador simplesmente não aparece.
      });
  }, []);

  if (storeOpen === null) return null;

  return (
    <div className="ml-auto flex items-center gap-1.5 text-xs">
      <span
        className={`h-2 w-2 rounded-full ${
          storeOpen ? "bg-green-500" : "bg-gray-400"
        }`}
      />
      <span className={storeOpen ? "text-green-600" : "text-gray-500"}>
        {storeOpen ? "Loja aberta" : "Loja fechada"}
      </span>
    </div>
  );
};

export default StoreStatusDot;
