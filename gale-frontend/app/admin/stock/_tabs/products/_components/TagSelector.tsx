import { useState } from "react";
import { useProducts } from "@/_store/products/ProductContext";
import { translateCategory } from "@/_constants/product";
import { normalize } from "@/_utils/normalize-string";

// Não utilizado
const TagSelector = ({
  allTags,
  selected,
  onChange,
}: {
  allTags: string[];
  selected: string[];
  onChange: (tags: string[]) => void;
}) => {
  function toggleTag(tag: string) {
    if (selected.includes(tag)) onChange(selected.filter((t) => t !== tag));
    else onChange([...selected, tag]);
  }
  return (
    <div className="mb-2 flex flex-wrap gap-2">
      {allTags.map((tag) => (
        <button
          type="button"
          key={tag}
          onClick={() => toggleTag(tag)}
          className={`rounded-full px-3 py-1 text-xs transition ${
            selected.includes(tag)
              ? "bg-primary text-white"
              : "bg-muted text-muted-foreground border"
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
};

export default TagSelector;
