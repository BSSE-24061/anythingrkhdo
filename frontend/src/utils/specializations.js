export const FALLBACK_SPECIALIZATIONS = [
  { name: "Allergy and Immunology", description: "Immune system conditions, allergies, and asthma.", doctor_count: 0 },
  { name: "Anesthesiology", description: "Anesthesia, perioperative care, and pain control.", doctor_count: 0 },
  { name: "Audiology", description: "Hearing, balance, and related ear conditions.", doctor_count: 0 },
  { name: "Bariatric Medicine", description: "Medical care for obesity and weight management.", doctor_count: 0 },
  { name: "Cardiology", description: "Heart and vascular system health.", doctor_count: 0 },
  { name: "Cardiothoracic Surgery", description: "Surgery for heart, lungs, and chest organs.", doctor_count: 0 },
  { name: "Critical Care Medicine", description: "Care for life-threatening illness and ICU patients.", doctor_count: 0 },
  { name: "Dentistry", description: "Teeth, gums, and oral health care.", doctor_count: 0 },
  { name: "Dermatology", description: "Skin, hair, and nail conditions.", doctor_count: 0 },
  { name: "Endocrinology", description: "Hormones, diabetes, thyroid, and metabolic conditions.", doctor_count: 0 },
  { name: "ENT", description: "Ear, nose, throat, sinus, and voice conditions.", doctor_count: 0 },
  { name: "Family Medicine", description: "Whole-family primary care across all ages.", doctor_count: 0 },
  { name: "Gastroenterology", description: "Digestive tract, liver, and pancreas care.", doctor_count: 0 },
  { name: "General Medicine", description: "Primary adult medical care and common illnesses.", doctor_count: 0 },
  { name: "General Surgery", description: "Surgical care for common abdominal and soft tissue problems.", doctor_count: 0 },
  { name: "Geriatrics", description: "Medical care focused on older adults.", doctor_count: 0 },
  { name: "Gynecology", description: "Women's reproductive and pelvic health.", doctor_count: 0 },
  { name: "Hematology", description: "Blood disorders and clotting conditions.", doctor_count: 0 },
  { name: "Hepatology", description: "Liver, gallbladder, and bile duct conditions.", doctor_count: 0 },
  { name: "Infectious Disease", description: "Complex infections and antimicrobial care.", doctor_count: 0 },
  { name: "Internal Medicine", description: "Adult diagnosis, treatment, and preventive care.", doctor_count: 0 },
  { name: "Neonatology", description: "Medical care for newborns and premature infants.", doctor_count: 0 },
  { name: "Nephrology", description: "Kidney disease, dialysis, and blood pressure care.", doctor_count: 0 },
  { name: "Neurology", description: "Brain, spine, nerve, and nervous system disorders.", doctor_count: 0 },
  { name: "Neurosurgery", description: "Surgery for brain, spine, and nerve disorders.", doctor_count: 0 },
  { name: "Nutrition and Dietetics", description: "Diet planning, clinical nutrition, and wellness.", doctor_count: 0 },
  { name: "Obstetrics", description: "Pregnancy, childbirth, and postpartum care.", doctor_count: 0 },
  { name: "Obstetrics and Gynecology", description: "Pregnancy and women's reproductive health.", doctor_count: 0 },
  { name: "Oncology", description: "Cancer diagnosis, treatment, and follow-up care.", doctor_count: 0 },
  { name: "Ophthalmology", description: "Eye disease, vision care, and eye surgery.", doctor_count: 0 },
  { name: "Orthopedics", description: "Bones, joints, ligaments, and musculoskeletal care.", doctor_count: 0 },
  { name: "Pain Medicine", description: "Diagnosis and treatment of acute and chronic pain.", doctor_count: 0 },
  { name: "Pathology", description: "Laboratory diagnosis of disease.", doctor_count: 0 },
  { name: "Pediatrics", description: "Medical care for infants, children, and adolescents.", doctor_count: 0 },
  { name: "Physical Medicine and Rehabilitation", description: "Recovery, mobility, and functional rehabilitation.", doctor_count: 0 },
  { name: "Plastic Surgery", description: "Reconstructive and cosmetic surgical care.", doctor_count: 0 },
  { name: "Psychiatry", description: "Mental health, behavior, and medication management.", doctor_count: 0 },
  { name: "Psychology", description: "Therapy, testing, and behavioral health support.", doctor_count: 0 },
  { name: "Pulmonology", description: "Lung and breathing conditions.", doctor_count: 0 },
  { name: "Radiology", description: "Medical imaging and image-guided diagnosis.", doctor_count: 0 },
  { name: "Rheumatology", description: "Autoimmune, joint, and connective tissue disorders.", doctor_count: 0 },
  { name: "Sleep Medicine", description: "Sleep disorders, insomnia, and sleep apnea.", doctor_count: 0 },
  { name: "Sports Medicine", description: "Exercise injuries, performance, and musculoskeletal health.", doctor_count: 0 },
  { name: "Urology", description: "Urinary tract and male reproductive health.", doctor_count: 0 },
  { name: "Vascular Surgery", description: "Surgery for arteries, veins, and circulation problems.", doctor_count: 0 },
];

export const normalizeSpecializations = (items) => {
  const rows = Array.isArray(items) && items.length ? items : FALLBACK_SPECIALIZATIONS;

  return rows
    .map((item) => {
      if (typeof item === "string") {
        return { name: item, description: "", doctor_count: 0 };
      }

      return {
        name: item.name || item.specialization || "",
        description: item.description || "",
        doctor_count: Number(item.doctor_count || item.count || 0),
      };
    })
    .filter((item) => item.name)
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const getSpecializationNames = (items) =>
  normalizeSpecializations(items).map((item) => item.name);
