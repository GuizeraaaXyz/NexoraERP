"use client";

import { useState } from "react";
import { updateConfiguracao } from "@/app/actions/config";

export function ConfigToggle({ initialValue }: { initialValue: boolean }) {
  const [value, setValue] = useState(initialValue);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    const newValue = !value;
    setValue(newValue);
    setLoading(true);
    await updateConfiguracao(newValue);
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`erp-button ${value ? "primary" : "ghost"}`}
      disabled={loading}
    >
      {value ? "Ativo" : "Inativo"}
    </button>
  );
}
