import { useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import { TOKEN_KEY, getApiBaseUrl } from "../services/apiClient.js";

export function useStockHub(onStockUpdated) {
  const handlerRef = useRef(onStockUpdated);
  handlerRef.current = onStockUpdated;

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return undefined;

    const base = getApiBaseUrl();
    const hubUrl = `${base}/hubs/stock`;
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .build();

    connection.on("StockUpdated", (payload) => {
      handlerRef.current?.(payload);
    });

    connection
      .start()
      .then(() => connection.invoke("SubscribeStockUpdates"))
      .catch(() => {
        /* hub optional in local dev */
      });

    return () => {
      connection.stop();
    };
  }, []);
}
