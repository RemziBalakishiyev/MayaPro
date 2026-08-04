import clsx, { type ClassValue } from "clsx";

/** Tailwind class-larını şərtli birləşdirmək üçün köməkçi. */
export const cn = (...inputs: ClassValue[]) => clsx(inputs);
