import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus:ring-2 focus:ring-[#f75a2f]/20 focus:border-[#f75a2f81] focus-visible:ring-offset-0 border border-[#f4e6d9] focus-visible:ring-offset-background aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 aria-invalid:ring-offset-0 aria-invalid:ring-offset-background dark:aria-invalid:border-destructive dark:aria-invalid:ring-2 dark:aria-invalid:ring-destructive/40 dark:aria-invalid:ring-offset-0 dark:aria-invalid:ring-offset-background",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  );
}

export { Input };
