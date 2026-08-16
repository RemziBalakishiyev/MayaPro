import { useMutation } from "@tanstack/react-query";
import { authApi, type RegisterTenantInput } from "./api";

/** FE#183 — yeni mağaza qeydiyyatı (anonim, tokensiz). */
export const useRegisterTenant = () =>
  useMutation({
    mutationFn: (input: RegisterTenantInput) => authApi.register(input),
  });
