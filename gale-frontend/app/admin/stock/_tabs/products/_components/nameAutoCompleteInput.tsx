import { useProducts } from "@/_store/products/ProductContext";
import { useState } from "react";
import { useFormContext } from "react-hook-form";

const NameAutocompleteInput = (
  props: React.InputHTMLAttributes<HTMLInputElement>,
) => {
  const { products } = useProducts();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [value, setValue] = useState("");
  const allNames = products?.map((p) => p.name.toLowerCase()) ?? [];

  // Mostra os 5 primeiros nomes parecidos
  const suggestions = allNames
    .filter(
      (name) =>
        value &&
        name.includes(value.toLowerCase()) &&
        name !== value.toLowerCase(),
    )
    .slice(0, 10);

  function handleSelectSuggestion(suggestion: string) {
    setValue(suggestion);
    if (props.onChange) {
      // Simula evento para react-hook-form
      props.onChange({
        target: { value: suggestion },
      } as any);
    }
    setShowSuggestions(false);
  }

  return (
    <div className="relative">
      <input
        {...props}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (props.onChange) props.onChange(e);
        }}
        className="w-full rounded border p-2"
        placeholder="Nome do produto"
        autoComplete="off"
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 z-10 mt-1 max-h-40 overflow-auto rounded border bg-white shadow">
          {suggestions.map((suggestion) => (
            <li
              key={suggestion}
              onMouseDown={() => handleSelectSuggestion(suggestion)}
              className="hover:bg-primary/10 cursor-pointer px-3 py-2"
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
      {suggestions.length === 0 &&
        value &&
        allNames.includes(value.toLowerCase()) && (
          <span className="absolute mt-1 block text-xs text-red-500">
            Já existe um produto com esse nome!
          </span>
        )}
    </div>
  );
};
export default NameAutocompleteInput;
