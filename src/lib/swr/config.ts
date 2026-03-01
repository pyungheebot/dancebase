import type { SWRConfiguration } from "swr";

export const swrConfig: SWRConfiguration = {
  dedupingInterval: 5000,
  revalidateOnFocus: true,
  keepPreviousData: true,
  onError: (error, key) => {
    if (process.env.NODE_ENV === "development") {
      console.error(`[SWR] ${key}:`, error);
    }
  },
};
