// Consulta de CEP pelo ViaCEP: gratuito, sem chave e com CORS liberado,
// então é chamado direto do navegador (não passa pelo nosso backend).

export interface CepAddress {
  // Tipo do logradouro já separado do nome, no mesmo formato do enum
  // TypeAddress do banco (ex: "Avanue" pra "Avenida Vinte e Um").
  typeAddress: string | null;
  address: string;
  district: string;
  city: string;
  state: string;
}

// O ViaCEP devolve o logradouro inteiro ("Avenida Vinte e Um"), mas o
// cadastro guarda o tipo separado do nome. A ordem importa: prefixos mais
// longos são testados antes pra "Av." não ser confundido com outra coisa.
const TYPE_PREFIXES: { value: string; prefixes: string[] }[] = [
  { value: "Avanue", prefixes: ["Avenida", "Av.", "Av"] },
  { value: "Highway", prefixes: ["Rodovia", "Rod.", "Rod"] },
  { value: "Condominium", prefixes: ["Condomínio", "Condominio", "Cond."] },
  { value: "Square", prefixes: ["Praça", "Praca", "Pça.", "Pc."] },
  { value: "Street", prefixes: ["Rua", "R."] },
  { value: "Alley", prefixes: ["Beco"] },
  { value: "Lane", prefixes: ["Travessa", "Tv.", "Trav."] },
  { value: "Road", prefixes: ["Estrada", "Est."] },
  { value: "Village", prefixes: ["Vila", "Vl."] },
];

const splitLogradouro = (
  logradouro: string,
): { typeAddress: string | null; address: string } => {
  const trimmed = logradouro.trim();

  for (const { value, prefixes } of TYPE_PREFIXES) {
    for (const prefix of prefixes) {
      // Só corta quando o prefixo é uma palavra inteira no começo.
      const pattern = new RegExp(
        `^${prefix.replace(/\./g, "\\.")}\\s+`,
        "i",
      );
      if (pattern.test(trimmed)) {
        return { typeAddress: value, address: trimmed.replace(pattern, "") };
      }
    }
  }

  return { typeAddress: null, address: trimmed };
};

export const onlyDigits = (value: string): string => value.replace(/\D/g, "");

// Formata pra 00000-000 conforme a pessoa digita.
export const formatCep = (value: string): string => {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

export const isCompleteCep = (value: string): boolean =>
  onlyDigits(value).length === 8;

// Devolve null quando o CEP não existe ou a consulta falha — nesse caso a
// pessoa preenche o endereço na mão.
export const lookupCep = async (cep: string): Promise<CepAddress | null> => {
  const digits = onlyDigits(cep);
  if (digits.length !== 8) return null;

  try {
    const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data || data.erro) return null;

    const { typeAddress, address } = splitLogradouro(data.logradouro ?? "");

    return {
      typeAddress,
      address,
      district: data.bairro ?? "",
      city: data.localidade ?? "",
      state: data.uf ?? "",
    };
  } catch {
    return null;
  }
};
