import { apiFetch } from "@/lib/api/client";
import {
  BroadcastNotificationRequest,
  BroadcastNotificationResponse,
} from "@/types/api";

export const notificationsService = {
  /** Difusión de un push a la audiencia indicada. Solo admins del club activo. */
  async broadcast(
    payload: BroadcastNotificationRequest,
  ): Promise<BroadcastNotificationResponse> {
    return apiFetch<BroadcastNotificationResponse>("/notifications/broadcast", {
      method: "POST",
      body: payload,
    });
  },
};
