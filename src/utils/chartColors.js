function readCssVar(name, fallback) {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

export function getChartColors() {
  return {
    chart1: readCssVar("--chart-1", "#1e3a5f"),
    chart2: readCssVar("--chart-2", "#2563eb"),
    chart3: readCssVar("--chart-3", "#059669"),
    chart4: readCssVar("--chart-4", "#b45309"),
    chartIn: readCssVar("--chart-in", "#059669"),
    chartOut: readCssVar("--chart-out", "#be123c"),
    chartTransfer: readCssVar("--chart-transfer", "#2563eb"),
    muted: readCssVar("--muted", "#5a6a7e"),
    border: readCssVar("--border", "#dce3ec"),
  };
}
