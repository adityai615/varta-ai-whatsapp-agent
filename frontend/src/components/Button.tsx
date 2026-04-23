import type { ButtonHTMLAttributes } from "react";

export function Button(
  props: ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary";
    size?: "sm" | "md";
  },
) {
  const { className, variant = "primary", size = "md", ...rest } = props;
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed";
  const sizes = size === "sm" ? "px-3 py-2 text-xs" : "px-4 py-2 text-sm";
  const variants =
    variant === "primary"
      ? "bg-whatsapp-green text-white shadow-sm hover:-translate-y-[1px] hover:shadow-md hover:brightness-95"
      : "border border-whatsapp-border bg-white text-whatsapp-text hover:bg-whatsapp-green/5";
  return <button className={[base, sizes, variants, className || ""].join(" ")} {...rest} />;
}

