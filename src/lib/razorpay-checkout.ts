/**
 * Client-side Razorpay Checkout loader (promise-cached script injector).
 * Safe to import from client components only.
 */

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";
const LOAD_TIMEOUT_MS = 15_000;

let loader: Promise<boolean> | null = null;

function razorpayReady(): boolean {
  return typeof window !== "undefined" && typeof window.Razorpay === "function";
}

/**
 * Injects the Razorpay checkout script once and resolves to true when
 * `window.Razorpay` is available. Resolves false on failure/timeout —
 * a later call may retry.
 */
export function loadRazorpay(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (razorpayReady()) return Promise.resolve(true);
  if (loader) return loader;

  loader = new Promise<boolean>((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      if (!ok) loader = null; // allow retry on the next attempt
      resolve(ok);
    };

    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => finish(razorpayReady());
    script.onerror = () => finish(false);
    document.head.appendChild(script);

    window.setTimeout(() => finish(razorpayReady()), LOAD_TIMEOUT_MS);
  });

  return loader;
}
