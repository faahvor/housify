"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { FormInput } from "@/components/form-input";

interface PasswordInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete?: string;
  className?: string;
  required?: boolean;
  variant?: "solid" | "dark" | "light";
}

const ICON_COLOR = {
  solid: "text-foreground/45 hover:text-foreground/80",
  dark: "text-cream/50 hover:text-cream/90",
  light: "text-ink/50 hover:text-ink/90",
};

export function PasswordInput({
  value,
  onChange,
  placeholder,
  autoComplete,
  className = "",
  required = true,
  variant = "solid",
}: PasswordInputProps) {
  const [show, setShow] = useState(false);
  return (
    <div className={`relative min-w-[200px] flex-1 ${className}`}>
      <FormInput
        variant={variant}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="pr-11"
        required={required}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className={`absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer ${ICON_COLOR[variant]}`}
      >
        {show ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
      </button>
    </div>
  );
}
