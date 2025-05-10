export function validateCpfCnpj(value: string): boolean {
  const clean = value.replace(/\D/g, "");

  if (clean.length === 11) {
    if (/^(\d)\1{10}$/.test(clean)) return false;
    const digits = clean.split("").map((d) => parseInt(d, 10));

    let sum = 0;
    //First DIGIT
    for (let i = 0; i < 9; i++) sum += digits[i] * (10 - i);
    let check1 = 11 - (sum % 11);
    if (check1 >= 10) check1 = 0;
    if (check1 !== digits[9]) return false;
    //Second DIGIT
    sum = 0;
    for (let i = 0; i < 10; i++) sum += digits[i] * (11 - i);
    let check2 = 11 - (sum % 11);
    if (check2 >= 10) check2 = 0;
    return check2 === digits[10];
  }

  if (clean.length === 14) {
    if (/^(\d)\1{13}$/.test(clean)) return false;
    const digits = clean.split("").map((d) => parseInt(d, 10));
    const calc = (weights: number[], pos: number) => {
      const sum = weights.reduce((acc, w, i) => acc + digits[i] * w, 0);
      const mod = sum % 11;
      return mod < 2 ? 0 : 11 - mod;
    };
    const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    return calc(w1, 12) === digits[12] && calc(w2, 13) === digits[13];
  }

  return false;
}
