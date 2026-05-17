const DOSE_SLOTS = {
  morning: { label: "Morning", time: "09:00" },
  afternoon: { label: "Afternoon", time: "14:00" },
  evening: { label: "Evening", time: "20:00" },
};

const isValidDosePeriod = (period) =>
  Object.prototype.hasOwnProperty.call(DOSE_SLOTS, period);

module.exports = {
  DOSE_SLOTS,
  isValidDosePeriod,
};
