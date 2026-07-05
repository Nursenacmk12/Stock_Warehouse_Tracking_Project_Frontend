import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const queryKeys = {
  products: ["products"],
  warehouses: ["warehouses"],
  stocks: (filters) => ["stocks", filters],
  dashboardSummary: ["dashboard", "summary"],
  lowStockAlerts: ["alerts", "low-stock"],
  movementTrend: (granularity) => ["reports", "movement-trend", granularity],
  integrations: ["integrations"],
  healthStatus: ["health", "status"],
};
