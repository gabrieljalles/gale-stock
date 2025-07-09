export function formatPhone(value: string) {
  return (
    value
      // remove tudo que não for dígito
      .replace(/\D/g, "")
      // abre parênteses após os 2 primeiros dígitos e espaço
      .replace(/^(\d{2})(\d)/, "($1) $2")
      // coloca hífen depois de 5 dígitos do número
      .replace(/(\d{5})(\d)/, "$1-$2")
      // impede que digite mais de 4 dígitos após o hífen
      .replace(/(-\d{4})\d+?$/, "$1")
  );
}
