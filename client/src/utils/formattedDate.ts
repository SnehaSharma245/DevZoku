// utils/formatDate.ts

export function formatDateTime(
  utcString: string,
  options?: {
    locale?: string;
    timeZone?: string;
    dateStyle?: "short" | "medium" | "long" | "full";
    timeStyle?: "short" | "medium" | "long" | "full";
    showOnly?: "date" | "time";
  }
): string {
  try {
    if (!utcString) return "Invalid date";
    const {
      locale = "en-IN",
      timeZone = "Asia/Kolkata", // default: IST
      dateStyle = "medium",
      timeStyle = "short",
      showOnly,
    } = options || {};

    const date = new Date(utcString);
    if (isNaN(date.getTime())) return "Invalid date";
    if (showOnly === "date") {
      return date.toLocaleDateString(locale, { timeZone, dateStyle });
    }

    if (showOnly === "time") {
      return date.toLocaleTimeString(locale, { timeZone, timeStyle });
    }

    return date.toLocaleString(locale, {
      timeZone,
      dateStyle,
      timeStyle,
    });
  } catch (error) {
    console.error("❌ Invalid date format:", error);
    return "Invalid date";
  }
}
