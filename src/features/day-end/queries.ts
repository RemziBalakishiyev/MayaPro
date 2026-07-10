import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { closingsApi } from "./api";
import { todayISO } from "@/lib/format";
import type { Closing } from "@/types";

export const closingKeys = {
  all: ["closings"] as const,
};

export const useClosings = () =>
  useQuery({
    queryKey: closingKeys.all,
    queryFn: closingsApi.list,
  });

/** Bugünkü bağlanış (varsa). */
export const useTodayClosing = () =>
  useQuery({
    queryKey: closingKeys.all,
    queryFn: closingsApi.list,
    select: (closings: Closing[]) =>
      closings.find((c) => c.date === todayISO()) ?? null,
  });

export const useCloseDay = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<Closing, "id">) => closingsApi.closeDay(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["closings"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
    },
  });
};
