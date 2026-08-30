// Helper untuk menyimpan status panduan di localStorage

const TOUR_SEEN_KEY = "hsport_has_seen_tour";
const BANNER_DISMISSED_KEY = "hsport_guide_banner_dismissed";

export function getHasSeenTour(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(TOUR_SEEN_KEY) === "true";
  } catch {
    return false;
  }
}

export function setHasSeenTour(seen: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (seen) {
      localStorage.setItem(TOUR_SEEN_KEY, "true");
    } else {
      localStorage.removeItem(TOUR_SEEN_KEY);
    }
  } catch {
    // ignore
  }
}

export function getIsBannerDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(BANNER_DISMISSED_KEY) === "true";
  } catch {
    return false;
  }
}

export function setBannerDismissed(dismissed: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (dismissed) {
      localStorage.setItem(BANNER_DISMISSED_KEY, "true");
    } else {
      localStorage.removeItem(BANNER_DISMISSED_KEY);
    }
  } catch {
    // ignore
  }
}

export function resetAllTutorialState(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(TOUR_SEEN_KEY);
    localStorage.removeItem(BANNER_DISMISSED_KEY);
  } catch {
    // ignore
  }
}
