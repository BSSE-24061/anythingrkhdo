const APP_TIME_ZONE = "Asia/Karachi";
const APP_TIME_ZONE_OFFSET = "+05:00";

const getPart = (parts, type) => parts.find((part) => part.type === type)?.value;

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
  const date = new Date(`${dateValue}T${normalizedTime}:00${APP_TIME_ZONE_OFFSET}`);

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
