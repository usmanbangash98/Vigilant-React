import * as React from "react";
import { cn } from "@/lib/utils";

type SwitchBaseProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange" | "value"
> & {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

type SwitchProps = SwitchBaseProps;

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  (
    { checked, defaultChecked, onCheckedChange, className, disabled, ...props },
    ref,
  ) => {
    const [internalChecked, setInternalChecked] = React.useState(
      defaultChecked ?? false,
    );

    const isControlled = checked !== undefined;
    const currentChecked = isControlled ? checked : internalChecked;

    function toggle() {
      if (disabled) return;
      const next = !currentChecked;
      if (!isControlled) {
        setInternalChecked(next);
      }
      onCheckedChange?.(next);
    }

    return (
      <button
        type="button"
        role="switch"
        aria-checked={currentChecked}
        data-state={currentChecked ? "checked" : "unchecked"}
        aria-disabled={disabled}
        onClick={toggle}
        ref={ref}
        disabled={disabled}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-border/60 bg-muted transition-all",
          currentChecked && "bg-primary",
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
        {...props}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-background shadow transition-transform",
            currentChecked ? "translate-x-5" : "translate-x-1",
          )}
        />
      </button>
    );
  },
);

Switch.displayName = "Switch";
