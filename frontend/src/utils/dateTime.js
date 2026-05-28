const APP_TIME_ZONE = "Asia/Karachi";
const APP_TIME_ZONE_OFFSET = "+05:00";

const getPart = (parts, type) =>
  parts.find((part) => part.type === type)?.value;

const toAppDate = (value) => {
  if (value instanceof Date) return value;

  if (typeof value === "string") {
    return new Date(value.trim().replace(" ", "T"));
  }

  return new Date(value);
};

export const formatIslamabadDateTime = (value) => {
  if (!value) return "Date not recorded";

  const date = toAppDate(value);
  if (Number.isNaN(date.getTime())) return "Date not recorded";

  return new Intl.DateTimeFormat("en-PK", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: APP_TIME_ZONE,
  }).format(date);
};

export const getIslamabadDateValue = (value) => {
  const date = toAppDate(value);
  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: APP_TIME_ZONE,
  }).formatToParts(date);

  return `${getPart(parts, "year")}-${getPart(parts, "month")}-${getPart(parts, "day")}`;
};

export const getIslamabadTimeValue = (value) => {
  const date = toAppDate(value);
  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: APP_TIME_ZONE,
  }).formatToParts(date);

  return `${getPart(parts, "hour")}:${getPart(parts, "minute")}`;
};

export const getIslamabadWeekday = (dateValue) => {
  if (!dateValue) return "";

  const date = new Date(`${dateValue}T00:00:00${APP_TIME_ZONE_OFFSET}`);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: APP_TIME_ZONE,
  }).format(date);
};

export const createIslamabadDateTimeIso = (dateValue, timeValue) => {
  if (!dateValue || !timeValue) return "";

  const normalizedTime = String(timeValue).slice(0, 5);
  const date = new Date(
    `${dateValue}T${normalizedTime}:00${APP_TIME_ZONE_OFFSET}`,
  );

  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
};

export const createIslamabadDateTimeValue = (dateValue, timeValue) => {
  if (!dateValue || !timeValue) return "";

  return `${dateValue} ${String(timeValue).slice(0, 5)}:00`;
};

export const getUpcomingDateForWeekday = (weekday) => {
  const todayValue = getIslamabadDateValue(new Date());
  const today = new Date(`${todayValue}T00:00:00${APP_TIME_ZONE_OFFSET}`);

  for (let offset = 0; offset < 7; offset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    const dateValue = getIslamabadDateValue(date);

    if (getIslamabadWeekday(dateValue) === weekday) {
      return dateValue;
    }
  }

  return "";
};

// Get current time in Islamabad timezone as HH:MM format
export const getCurrentIslamabadTime = () => {
  return getIslamabadTimeValue(new Date());
};

// Get current date in Islamabad timezone as YYYY-MM-DD format
export const getCurrentIslamabadDate = () => {
  return getIslamabadDateValue(new Date());
};

// Check if a given time on a given date has already passed
export const hasTimePassed = (dateValue, timeValue) => {
  if (!dateValue || !timeValue) return true;

  const iso = createIslamabadDateTimeIso(dateValue, timeValue);
  return !iso || new Date(iso).getTime() <= Date.now();
};

// Check if a slot is in the future (strict check for appointment booking)
export const isFutureSlotStrict = (dateValue, timeValue) => {
  if (!dateValue || !timeValue) return false;

  const iso = createIslamabadDateTimeIso(dateValue, timeValue);
  if (!iso) return false;

  // Add 5 seconds buffer to ensure it's truly in the future
  return new Date(iso).getTime() > Date.now() + 5000;
};

// Get dose period based on current time (morning, afternoon, evening)
export const getDosePeriod = () => {
  const timeStr = getCurrentIslamabadTime();
  if (!timeStr) return "morning";

  const [hour, minute] = timeStr.split(":").map(Number);
  const totalMinutes = hour * 60 + minute;

  // Morning: 7 AM to 12 PM (420-720 minutes)
  if (totalMinutes >= 7 * 60 && totalMinutes < 12 * 60) {
    return "morning";
  }
  // Afternoon: 12:01 PM to 4 PM (721-960 minutes)
  if (totalMinutes >= 12 * 60 + 1 && totalMinutes < 16 * 60) {
    return "afternoon";
  }
  // Evening: 4:01 PM to 12 AM (961-1440 minutes)
  if (totalMinutes >= 16 * 60 + 1) {
    return "evening";
  }
  // Early morning before 7 AM - still considered evening of previous day
  return "evening";
};

// Check if current time is within the allowed window for a dose period
export const isWithinDoseWindow = (dosePeriod) => {
  const timeStr = getCurrentIslamabadTime();
  if (!timeStr) return false;

  const [hour, minute] = timeStr.split(":").map(Number);
  const totalMinutes = hour * 60 + minute;

  switch (dosePeriod) {
    case "morning":
      // 7 AM to 12 PM (420-720 minutes)
      return totalMinutes >= 7 * 60 && totalMinutes < 12 * 60;
    case "afternoon":
      // 12:01 PM to 4 PM (721-960 minutes)
      return totalMinutes >= 12 * 60 + 1 && totalMinutes < 16 * 60;
    case "evening":
      // 4:01 PM to 12 AM (961-1440 minutes)
      return totalMinutes >= 16 * 60 + 1;
    default:
      return false;
  }
};

// Get human-readable time window message for a dose period
export const getTimeWindowMessage = (dosePeriod) => {
  switch (dosePeriod) {
    case "morning":
      return "Available 7:00 AM - 11:59 AM";
    case "afternoon":
      return "Available 12:01 PM - 3:59 PM";
    case "evening":
      return "Available 4:01 PM - 11:59 PM";
    default:
      return "Scheduled dose";
  }
};
