"use client";

import { Competence, formatCompetence } from "@/api/finance";

interface CompetenceSelectProps {
  months: Competence[];
  value: Competence;
  onChange: (competence: Competence) => void;
}

const keyOf = ({ year, month }: Competence) => `${year}-${month}`;

/** Seletor de mês de competência, compartilhado pelas duas sub-abas. */
const CompetenceSelect = ({
  months,
  value,
  onChange,
}: CompetenceSelectProps) => {
  // O mês selecionado sempre entra na lista, mesmo sem movimento — senão o
  // <select> ficaria com um value que nenhuma <option> tem e apareceria
  // em branco.
  const options = months.some((m) => keyOf(m) === keyOf(value))
    ? months
    : [value, ...months];

  return (
    <label className="flex items-center gap-2 text-sm text-gray-700">
      Competência
      <select
        className="rounded-md border px-2 py-1.5 text-sm"
        value={keyOf(value)}
        onChange={(event) => {
          const [year, month] = event.target.value.split("-").map(Number);
          onChange({ year, month });
        }}
      >
        {options.map((competence) => (
          <option key={keyOf(competence)} value={keyOf(competence)}>
            {formatCompetence(competence)}
          </option>
        ))}
      </select>
    </label>
  );
};

export default CompetenceSelect;
