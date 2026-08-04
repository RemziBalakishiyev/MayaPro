import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { closingsApi, type CloseDayInput } from "./api";

export const closingKeys = {
  all: ["closings"] as const,
  today: ["closings", "today"] as const,
};

export const useClosings = () =>
  useQuery({
    queryKey: closingKeys.all,
    queryFn: closingsApi.list,
  });

/** Bugünkü bağlanış (varsa) — server GET /api/closings/today. */
export const useTodayClosing = () =>
  useQuery({
    queryKey: closingKeys.today,
    queryFn: closingsApi.today,
  });

export const useCloseDay = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CloseDayInput) => closingsApi.closeDay(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["closings"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
    },
  });
};
