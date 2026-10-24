"use client";

import { createContext, useContext } from "react";
import type { ViewRoute } from "@/lib/site";

export interface SiteUIValue {
  /** Current active view route */
  route: ViewRoute;
  /** Navigate to a view (hash-based, same page) */
  navigate: (route: ViewRoute, opts?: { anchor?: string }) => void;
  /** Open the global enquiry dialog, optionally pre-filled with a project */
  openEnquiry: (project?: string) => void;
  /** Jump to the booking experience (projects view, optionally preselecting a project) */
  goToBooking: (projectSlug?: string) => void;
}

export const SiteUIContext = createContext<SiteUIValue>({
  route: "home",
  navigate: () => {},
  openEnquiry: () => {},
  goToBooking: () => {},
});

export function useEnquiry() {
  return useContext(SiteUIContext);
}

export function useGoToBooking() {
  return useContext(SiteUIContext).goToBooking;
}

export function useSiteNav() {
  return useContext(SiteUIContext);
}
