import type { SWRConfiguration } from "swr";

export const swrConfig: SWRConfiguration = {
  dedupingInterval: 5000,
  revalidateOnFocus: true,
  keepPreviousData: true,
};
