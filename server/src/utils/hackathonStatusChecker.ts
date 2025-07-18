interface HackathonDates {
  regStart: Date;
  regEnd: Date;
  hackStart: Date;
  hackEnd: Date;
}

type HackathonStatus =
  | "upcoming"
  | "completed"
  | "ongoing"
  | "unknown"
  | "Registration in Progress"
  | "Registration ended";

export default function hackathonStatusChecker(
  regStart: HackathonDates["regStart"],
  regEnd: HackathonDates["regEnd"],
  hackStart: HackathonDates["hackStart"],
  hackEnd: HackathonDates["hackEnd"]
): HackathonStatus {
  const currentTime = new Date();

  if (currentTime < regStart) {
    return "upcoming";
  }

  if (currentTime < regEnd && currentTime > regStart) {
    return "Registration in Progress";
  }

  if (currentTime > regEnd && currentTime < hackStart) {
    return "Registration ended";
  }

  if (currentTime > hackStart && currentTime < hackEnd) {
    return "ongoing";
  }

  if (currentTime > hackEnd) {
    return "completed";
  }

  return "unknown";
}
