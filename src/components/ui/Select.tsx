import {
  Children,
  forwardRef,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEventHandler,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

type Option = {
  value: string;
  label: ReactNode;
  disabled?: boolean;
};

function parseOptions(children: ReactNode): Option[] {
  const opts: Option[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement<{
      value?: string | number;
      children?: ReactNode;
      disabled?: boolean;
    }>(child))
      return;
    if (child.type !== "option") return;

    const label = child.props.children;
    const value =
      child.props.value !== undefined
        ? String(child.props.value)
        : typeof label === "string" || typeof label === "number"
          ? String(label)
          : "";

    opts.push({
      value,
      label,
      disabled: child.props.disabled,
    });
  });
  return opts;
}

function labelText(label: ReactNode): string {
  if (typeof label === "string" || typeof label === "number") return String(label);
  return "";
}

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      children,
      className,
      disabled,
      value,
      defaultValue,
      onChange,
      onBlur,
      name,
      id,
      ...rest
    },
    ref,
  ) => {
    const options = useMemo(() => parseOptions(children), [children]);
    const listboxId = useId();
    const triggerRef = useRef<HTMLButtonElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const hiddenRef = useRef<HTMLSelectElement | null>(null);

    const isControlled = value !== undefined;
    const [uncontrolled, setUncontrolled] = useState(() =>
      String(defaultValue ?? ""),
    );
    const current = String(isControlled ? value : uncontrolled);

    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [coords, setCoords] = useState<{
      top: number;
      left: number;
      width: number;
      maxHeight: number;
      placement: "bottom" | "top";
    } | null>(null);

    const selected = options.find((o) => o.value === current);
    const display = selected?.label ?? "Seçin...";
    const muted = !selected || current === "";

    const setHiddenRef = useCallback(
      (node: HTMLSelectElement | null) => {
        hiddenRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );

    const updatePosition = useCallback(() => {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const gap = 6;
      const spaceBelow = window.innerHeight - rect.bottom - gap;
      const spaceAbove = rect.top - gap;
      const placement =
        spaceBelow >= 200 || spaceBelow >= spaceAbove ? "bottom" : "top";
      const available = placement === "bottom" ? spaceBelow : spaceAbove;
      setCoords({
        top: placement === "bottom" ? rect.bottom + gap : rect.top - gap,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.max(140, Math.min(288, available)),
        placement,
      });
    }, []);

    useLayoutEffect(() => {
      if (!open) return;
      updatePosition();
    }, [open, updatePosition, options.length]);

    useEffect(() => {
      if (!open) return;
      const onWin = () => updatePosition();
      window.addEventListener("resize", onWin);
      window.addEventListener("scroll", onWin, true);
      return () => {
        window.removeEventListener("resize", onWin);
        window.removeEventListener("scroll", onWin, true);
      };
    }, [open, updatePosition]);

    useEffect(() => {
      if (!open) return;
      const idx = Math.max(
        0,
        options.findIndex((o) => o.value === current && !o.disabled),
      );
      setActiveIndex(idx >= 0 ? idx : 0);
    }, [open, options, current]);

    useEffect(() => {
      if (!open || !listRef.current) return;
      const item = listRef.current.querySelector<HTMLElement>(
        `[data-index="${activeIndex}"]`,
      );
      item?.scrollIntoView({ block: "nearest" });
    }, [activeIndex, open]);

    useEffect(() => {
      if (!open) return;
      const onDoc = (e: MouseEvent) => {
        const t = e.target as Node;
        if (triggerRef.current?.contains(t) || listRef.current?.contains(t))
          return;
        setOpen(false);
      };
      const onKey = (e: globalThis.KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          setOpen(false);
          triggerRef.current?.focus();
        }
      };
      document.addEventListener("mousedown", onDoc);
      document.addEventListener("keydown", onKey);
      return () => {
        document.removeEventListener("mousedown", onDoc);
        document.removeEventListener("keydown", onKey);
      };
    }, [open]);

    const emitChange = (next: string) => {
      if (!isControlled) setUncontrolled(next);
      if (hiddenRef.current) hiddenRef.current.value = next;
      if (!onChange) return;
      const event = {
        target: { value: next, name: name ?? "", type: "select-one" },
        currentTarget: { value: next, name: name ?? "", type: "select-one" },
      } as ChangeEvent<HTMLSelectElement>;
      onChange(event);
    };

    const selectOption = (next: string) => {
      emitChange(next);
      setOpen(false);
      triggerRef.current?.focus();
    };

    const moveActive = (dir: 1 | -1) => {
      if (!options.length) return;
      let i = activeIndex;
      for (let step = 0; step < options.length; step++) {
        i = (i + dir + options.length) % options.length;
        if (!options[i]?.disabled) {
          setActiveIndex(i);
          return;
        }
      }
    };

    const onTriggerKeyDown = (e: ReactKeyboardEvent) => {
      if (disabled) return;
      if (
        e.key === "ArrowDown" ||
        e.key === "ArrowUp" ||
        e.key === "Enter" ||
        e.key === " "
      ) {
        e.preventDefault();
        if (!open) setOpen(true);
        else if (e.key === "ArrowDown") moveActive(1);
        else if (e.key === "ArrowUp") moveActive(-1);
        else if (e.key === "Enter" || e.key === " ") {
          const opt = options[activeIndex];
          if (opt && !opt.disabled) selectOption(opt.value);
        }
      }
    };

    const onListKeyDown = (e: ReactKeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        moveActive(1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        moveActive(-1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const opt = options[activeIndex];
        if (opt && !opt.disabled) selectOption(opt.value);
      } else if (e.key === "Home") {
        e.preventDefault();
        const first = options.findIndex((o) => !o.disabled);
        if (first >= 0) setActiveIndex(first);
      } else if (e.key === "End") {
        e.preventDefault();
        for (let i = options.length - 1; i >= 0; i--) {
          if (!options[i]?.disabled) {
            setActiveIndex(i);
            break;
          }
        }
      }
    };

    const dropdown =
      open &&
      coords &&
      createPortal(
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          onKeyDown={onListKeyDown}
          style={{
            position: "fixed",
            left: coords.left,
            width: coords.width,
            maxHeight: coords.maxHeight,
            ...(coords.placement === "bottom"
              ? { top: coords.top }
              : { bottom: window.innerHeight - coords.top }),
          }}
          className="z-[70] overflow-y-auto rounded-xl border border-stone-200 bg-white p-1.5 shadow-xl shadow-stone-900/10 outline-none"
        >
          {options.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-stone-400">Boş siyahı</li>
          ) : (
            options.map((opt, index) => {
              const isSelected = opt.value === current;
              const isActive = index === activeIndex;
              return (
                <li
                  key={`${opt.value}-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={opt.disabled || undefined}
                  data-index={index}
                  onMouseEnter={() => !opt.disabled && setActiveIndex(index)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    if (!opt.disabled) selectOption(opt.value);
                  }}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-base transition-colors",
                    opt.disabled && "cursor-not-allowed opacity-40",
                    isSelected &&
                      "bg-emerald-50 font-medium text-emerald-800",
                    !isSelected &&
                      isActive &&
                      !opt.disabled &&
                      "bg-stone-100 text-stone-900",
                    !isSelected &&
                      !isActive &&
                      !opt.disabled &&
                      "text-stone-700",
                  )}
                >
                  <span className="min-w-0 truncate">{opt.label}</span>
                  {isSelected && (
                    <Check
                      size={16}
                      strokeWidth={2.5}
                      className="shrink-0 text-emerald-600"
                    />
                  )}
                </li>
              );
            })
          )}
        </ul>,
        document.body,
      );

    return (
      <div className="relative w-full">
        <select
          ref={setHiddenRef}
          id={id}
          name={name}
          disabled={disabled}
          value={current}
          tabIndex={-1}
          aria-hidden
          onChange={() => {}}
          onFocus={() => triggerRef.current?.focus()}
          className="pointer-events-none absolute h-0 w-0 opacity-0"
          {...rest}
        >
          {options.map((opt, index) => (
            <option
              key={`${opt.value}-${index}`}
              value={opt.value}
              disabled={opt.disabled}
            >
              {labelText(opt.label)}
            </option>
          ))}
        </select>

        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          onClick={() => !disabled && setOpen((o) => !o)}
          onKeyDown={onTriggerKeyDown}
          onBlur={onBlur as unknown as FocusEventHandler<HTMLButtonElement>}
          className={cn(
            "relative flex h-12 w-full items-center rounded-xl border border-stone-300 bg-white pl-4 pr-11 text-left text-base outline-none transition-[border-color,box-shadow,background-color]",
            "hover:border-stone-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20",
            "disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-500 disabled:hover:border-stone-300",
            open && "border-emerald-500 ring-4 ring-emerald-500/20",
            muted && !disabled ? "text-stone-400" : "text-stone-900",
            className,
          )}
        >
          <span className="min-w-0 flex-1 truncate">{display}</span>
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-y-0 right-0 flex w-11 items-center justify-center",
              disabled ? "text-stone-300" : "text-stone-500",
            )}
          >
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg transition-transform",
                disabled ? "bg-transparent" : "bg-stone-100",
                open && !disabled && "rotate-180 bg-emerald-50 text-emerald-700",
              )}
            >
              <ChevronDown size={16} strokeWidth={2.25} />
            </span>
          </span>
        </button>

        {dropdown}
      </div>
    );
  },
);
Select.displayName = "Select";
