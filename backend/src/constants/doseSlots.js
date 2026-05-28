const DOSE_SLOTS = {
  morning: {
    label: "Morning",
    time: "09:00",
    startHour: 7,
    startMinute: 0,
    endHour: 12,
    endMinute: 0,
    inclusive: true, // 7:00 AM to 11:59 AM
  },
  afternoon: {
    label: "Afternoon",
    time: "14:00",
    startHour: 12,
    startMinute: 1,
    endHour: 16,
    endMinute: 0,
    inclusive: true, // 12:01 PM to 3:59 PM
  },
  evening: {
    label: "Evening",
    time: "20:00",
    startHour: 16,
    startMinute: 1,
    endHour: 24,
    endMinute: 0,
    inclusive: true, // 4:01 PM to 11:59 PM
  },
};

const isValidDosePeriod = (period) =>
  Object.prototype.hasOwnProperty.call(DOSE_SLOTS, period);

// Check if current time in Asia/Karachi timezone is within the dose window
const isWithinDoseWindow = (dosePeriod) => {
  if (!isValidDosePeriod(dosePeriod)) return false;

  const slot = DOSE_SLOTS[dosePeriod];

  // Get current time in Asia/Karachi timezone
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Karachi",
  });

  const timeParts = formatter.formatToParts(now);
  const hour = parseInt(timeParts.find((p) => p.type === "hour").value);
  const minute = parseInt(timeParts.find((p) => p.type === "minute").value);

  const currentTotalMinutes = hour * 60 + minute;
  const startTotalMinutes = slot.startHour * 60 + slot.startMinute;
  const endTotalMinutes = slot.endHour * 60 + slot.endMinute;

  // If endHour is 24 (midnight), it means till end of day
  if (slot.endHour === 24) {
    return currentTotalMinutes >= startTotalMinutes;
  }

  return (
    currentTotalMinutes >= startTotalMinutes &&
    currentTotalMinutes < endTotalMinutes
  );
};

// Get time window message for a dose period
const getTimeWindowMessage = (dosePeriod) => {
  if (!isValidDosePeriod(dosePeriod)) return "Scheduled dose";

  const slot = DOSE_SLOTS[dosePeriod];
  const startHour = String(slot.startHour).padStart(2, "0");
  const startMin = String(slot.startMinute).padStart(2, "0");
  const endHour = String(slot.endHour % 24).padStart(2, "0");
  const endMin = String(slot.endMinute).padStart(2, "0");

  if (slot.endHour === 24) {
    return `Available ${startHour}:${startMin} - 23:59`;
  }
  return `Available ${startHour}:${startMin} - ${endHour}:${endMin}`;
};

module.exports = {
  DOSE_SLOTS,
  isValidDosePeriod,
  isWithinDoseWindow,
  getTimeWindowMessage,
};
