import * as React from "react";
import { cn } from "@/lib/utils";

type SeparatorProps = React.HTMLAttributes<HTMLDivElement> & {
  orientation?: "horizontal" | "vertical";
};

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = "horizontal", role = "separator", ...props }, ref) => {
    return (
      <div
        ref={ref}
        role={role}
        aria-orientation={orientation}
        className={cn(
          "bg-border",
          orientation === "horizontal"
            ? "h-px w-full"
            : "h-full w-px",
          className,
        )}
        {...props}
      />
    );
  },
);

Separator.displayName = "Separator";

export { Separator };
