import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";

const base =
  "w-full bg-transparent text-[15px] font-sans outline-none placeholder:opacity-60";

const dark = `${base} border-0 border-b border-cream/35 px-4 py-4 text-cream`;
const light = `${base} border-0 border-b border-ink px-4 py-4 text-ink`;
// Enclosed, rounded field — used by newer forms (e.g. join) instead of the bare
// underline style so inputs read as tappable card elements rather than plain text.
const solid = `${base} rounded-xl border border-border bg-secondary/50 px-4 py-3.5 text-foreground transition-colors focus:border-primary focus:bg-background`;

// <select> renders its option list as a native, OS-drawn popup that does NOT pick up a
// transparent background from the page behind it — it falls back to a plain white popup.
// So the select (and its options) need an explicit, solid background/text pair, unlike
// FormInput/FormTextarea which can safely stay transparent over the panel behind them.
const selectBase =
  "w-full text-[15px] font-sans outline-none border-0 border-b px-4 py-4";
const selectDark = `${selectBase} border-cream/35 bg-foreground text-background`;
const selectLight = `${selectBase} border-ink bg-background text-foreground`;
const selectSolid = `w-full text-[15px] font-sans outline-none rounded-xl border border-border bg-secondary/50 px-4 py-3.5 text-foreground transition-colors focus:border-primary focus:bg-background`;

export type FormFieldVariant = "dark" | "light" | "solid";

function inputClass(variant: FormFieldVariant) {
  if (variant === "solid") return solid;
  return variant === "dark" ? dark : light;
}

export function FormInput({
  variant = "dark",
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { variant?: FormFieldVariant }) {
  return <input className={`${inputClass(variant)} ${className}`} {...props} />;
}

export function FormTextarea({
  variant = "dark",
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { variant?: FormFieldVariant }) {
  if (variant === "solid") {
    return <textarea className={`${solid} resize-none ${className}`} {...props} />;
  }
  const border = variant === "dark" ? "border-cream/35" : "border-ink";
  const color = variant === "dark" ? "text-cream" : "text-ink";
  return (
    <textarea
      className={`${base} resize-none border ${border} ${color} px-4 py-4 ${className}`}
      {...props}
    />
  );
}

export function FormSelect({
  variant = "dark",
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { variant?: FormFieldVariant }) {
  const cls = variant === "solid" ? selectSolid : variant === "dark" ? selectDark : selectLight;
  return (
    <select className={`${cls} ${className}`} {...props}>
      {children}
    </select>
  );
}
