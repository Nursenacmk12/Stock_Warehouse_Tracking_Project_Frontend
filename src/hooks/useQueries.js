import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "../services/productApi.js";
import { fetchWarehouses } from "../services/warehouseApi.js";
import { fetchStocks } from "../services/stockApi.js";
import { fetchDashboardSummary } from "../services/dashboardApi.js";
import { fetchLowStockAlerts } from "../services/alertApi.js";
import { fetchIntegrations } from "../services/integrationApi.js";
import { fetchMovementTrend } from "../services/reportApi.js";
import { queryKeys } from "../lib/queryClient.js";

export function useProducts() {
  return useQuery({
    queryKey: queryKeys.products,
    queryFn: fetchProducts,
  });
}

export function useWarehouses() {
  return useQuery({
    queryKey: queryKeys.warehouses,
    queryFn: fetchWarehouses,
  });
}

export function useStocks(filters = {}) {
  return useQuery({
    queryKey: queryKeys.stocks(filters),
    queryFn: () => fetchStocks(filters),
  });
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.dashboardSummary,
    queryFn: fetchDashboardSummary,
  });
}

export function useLowStockAlerts() {
  return useQuery({
    queryKey: queryKeys.lowStockAlerts,
    queryFn: fetchLowStockAlerts,
  });
}

export function useMovementTrend(granularity = "daily") {
  return useQuery({
    queryKey: queryKeys.movementTrend(granularity),
    queryFn: () => fetchMovementTrend(granularity),
  });
}

export function useIntegrations() {
  return useQuery({
    queryKey: queryKeys.integrations,
    queryFn: fetchIntegrations,
  });
}
