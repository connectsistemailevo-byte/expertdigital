import { useEffect, useMemo, useState, useRef } from "react";
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
  const { status, startTracking } = useBackgroundTracking({ providerId });
  const hasAttemptedRef = useRef(false);

  const isTrackingRoute = useMemo(() => {
    const p = routerLocation.pathname;
    return p === "/tracking" || p === "/rastreamento";
  }, [routerLocation.pathname]);

  useEffect(() => {
    // Only auto-start if the provider enabled it previously
    if (!readAutoEnabled()) return;
    // Don't auto-start on the tracking page (manual control there)
    if (isTrackingRoute) return;
    // Only attempt once per mount and when idle
    if (status !== "idle") return;
    if (hasAttemptedRef.current) return;

    hasAttemptedRef.current = true;
    
    // Auto-start tracking for ALL contexts (browser + PWA)
    // This runs when the provider opens the site/app
    console.log('[AutoTracking] Auto-starting tracking for provider:', providerId);
    startTracking();
  }, [isTrackingRoute, status, startTracking, providerId]);

  return null;
}

/**
 * Starts provider tracking automatically across the app (client pages included),
 * but only after the provider has enabled tracking once.
 * Works in both browser and PWA mode.
 */
export function ProviderAutoTracking() {
  const [providerId, setProviderId] = useState<string | null>(null);
  const [autoEnabled, setAutoEnabled] = useState(false);

  useEffect(() => {
    setProviderId(readStoredProviderId());
    setAutoEnabled(readAutoEnabled());

    const onStorage = () => {
      setProviderId(readStoredProviderId());
      setAutoEnabled(readAutoEnabled());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!providerId) return null;
  // Only mount the inner tracker when auto-tracking is enabled
  if (!autoEnabled) return null;

  return <ProviderAutoTrackingInner providerId={providerId} />;
}
