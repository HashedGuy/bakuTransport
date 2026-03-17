import type { Lang } from "@/components/i18n/LangProvider";

export const UI_COPY: Record<
  Lang,
  {
    // shared
    days: string;
    total: string;
    avgPerDay: string;
    peak: string;
    selectMonth: string;
    // metro
    dailyTrips: string;
    topStationsCombined: string;
    topStationsSubtitle: string;
    weekdayPattern: string;
    weekdaySubtitle: string;
    tooltipDate: string;
    tooltipTrips: string;
    subwayTag: string;
    // error
    dataUnavailableTitle: string;
    dataUnavailableHint: string;
  }
> = {
  en: {
    days: "Days",
    total: "Total",
    avgPerDay: "Avg/day",
    peak: "Peak",
    selectMonth: "Select month",
    dailyTrips: "Daily trips",
    topStationsCombined: "Top stations (combined)",
    topStationsSubtitle: "Total passenger entries by station (from provided months)",
    weekdayPattern: "Weekday pattern",
    weekdaySubtitle: "Average trips per weekday (2025 vs 2026)",
    tooltipDate: "Date",
    tooltipTrips: "Trips",
    subwayTag: "Subway",
    dataUnavailableTitle: "Data temporarily unavailable",
    dataUnavailableHint: "This page is dynamic; in production it will load data at request-time.",
  },
  az: {
    days: "Gün",
    total: "Cəmi",
    avgPerDay: "Günlük orta",
    peak: "Pik",
    selectMonth: "Ay seçin",
    dailyTrips: "Gündəlik gedişlər",
    topStationsCombined: "Ən aktiv stansiyalar (cəmi)",
    topStationsSubtitle: "Stansiya üzrə ümumi giriş sayı (mövcud aylar üzrə)",
    weekdayPattern: "Həftəlik nümunə",
    weekdaySubtitle: "Həftə günləri üzrə orta gediş (2025 və 2026)",
    tooltipDate: "Tarix",
    tooltipTrips: "Gediş",
    subwayTag: "Metro",
    dataUnavailableTitle: "Məlumat müvəqqəti əlçatan deyil",
    dataUnavailableHint: "Bu səhifə dinamikdir; prod mühitdə sorğu zamanı yüklənəcək.",
  },
};

