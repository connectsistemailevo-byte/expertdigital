import { useEffect, useMemo, useState } from "react";
import { useLocation as useRouterLocation } from "react-router-dom";
import { useBackgroundTracking } from "@/hooks/useBackgroundTracking";

const PROVIDER_STORAGE_KEY = "showtime_provider_data";
const AUTO_TRACKING_KEY = "showtime_provider_auto_tracking";

function readStoredProviderId(): string | null {
  try {
    const raw = localStorage.getItem(PROVIDER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed?.id === "string" ? parsed.id : null;
  } catch {
    return null;
  }
}

function readAutoEnabled(): boolean {
  return localStorage.getItem(AUTO_TRACKING_KEY) === "true";
}

function ProviderAutoTrackingInner({ providerId }: { providerId: string }) {
  const routerLocation = useRouterLocation();
  const { isPWA, status, startTracking } = useBackgroundTracking({ providerId });

  const isTrackingRoute = useMemo(() => {
    const p = routerLocation.pathname;
    return p === "/tracking" || p === "/rastreamento";
  }, [routerLocation.pathname]);

  useEffect(() => {
    // Only auto-start if the provider enabled it previously
    if (!readAutoEnabled()) return;
    if (!isPWA) return;
    if (isTrackingRoute) return;
    if (status !== "idle") return;

    // Auto-start (will be silent if permission already granted)
    startTracking();
  }, [isPWA, isTrackingRoute, status, startTracking]);

  return null;
}

/**
 * Starts provider tracking automatically across the app (client pages included),
 * but only after the provider has enabled tracking once.
 */
export function ProviderAutoTracking() {
  const [providerId, setProviderId] = useState<string | null>(null);

  useEffect(() => {
    setProviderId(readStoredProviderId());

    const onStorage = () => setProviderId(readStoredProviderId());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!providerId) return null;
  // Only mount the inner tracker when auto-tracking is enabled
  if (!readAutoEnabled()) return null;

  return <ProviderAutoTrackingInner providerId={providerId} />;
}
