import { useEffect, useState } from "react";
import { prescriptionApi } from "../../utils/apiHelper";
import { getStoredUser } from "../../utils/session";

const Prescriptions = () => {
  const user = getStoredUser();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPrescription, setExpandedPrescription] = useState(null);
  const [medicationsCache, setMedicationsCache] = useState({});

  useEffect(() => {
    const loadPrescriptions = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const response = await prescriptionApi.byPatient(user.id);
        setPrescriptions(response.data || []);
      } catch (error) {
        console.error("Error loading prescriptions:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPrescriptions();
  }, [user?.id]);

  const loadMedications = async (prescriptionId) => {
    if (expandedPrescription === prescriptionId) {
      setExpandedPrescription(null);
      return;
    }

    setExpandedPrescription(prescriptionId);

    if (medicationsCache[prescriptionId]) return; // Already cached

    try {
      const response = await prescriptionApi.byPrescription(prescriptionId);
      setMedicationsCache(prev => ({
        ...prev,
        [prescriptionId]: response.data || []
      }));
    } catch (error) {
      console.error("Error loading medications:", error);
    }
  };

  const formatPrescriptionDate = (value) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDoseSchedule = (med) => {
    if (med.dosage_schedule && typeof med.dosage_schedule === "object") {
      return Object.entries(med.dosage_schedule)
        .map(([period, dose]) => `${period.charAt(0).toUpperCase() + period.slice(1)}: ${dose}`)
        .join(" • ");
    }

    return med.dosage || "Dose not specified";
  };

  return (
    <div className="page-shell">
      <section className="hero-panel">
        <div>
          <h1 className="eyebrow">Medical Records</h1>
          <h2>My Prescriptions</h2>
          <p className="muted">
            View prescriptions written by your doctors and see all related medication details.
          </p>
        </div>
      </section>

      <section className="grid-layout" style={{ gridTemplateColumns: "1fr" }}>
        <div className="panel">
          {loading ? (
            <p className="muted" style={{ textAlign: "center", padding: 40 }}>Retrieving prescriptions...</p>
          ) : prescriptions.length > 0 ? (
            <div className="list-stack">
              {prescriptions.map((prescription) => (
                <div key={prescription.prescription_id} className="list-item" style={{ padding: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: "0 0 8px 0", fontSize: "1.4rem", color: "var(--text)" }}>
                        {prescription.diagnosis}
                      </h3>
                      <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
                        <span className="muted" style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                          📅 Prescribed: {formatPrescriptionDate(prescription.prescribed_at)}
                        </span>
                        {prescription.doctor_name && (
                          <span className="muted" style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                            👨‍⚕️ Dr. {prescription.doctor_name}
                          </span>
                        )}
                        <span className="muted" style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                          🔄 Follow-up: {formatPrescriptionDate(prescription.follow_up_date)}
                        </span>
                      </div>
                      
                      {prescription.diagnosis_notes && (
                        <p style={{ margin: "0 0 8px 0", color: "var(--text)", lineHeight: 1.5 }}>
                          <strong>Notes:</strong> {prescription.diagnosis_notes}
                        </p>
                      )}
                      {prescription.symptoms_notes && (
                        <p style={{ margin: "0 0 16px 0", color: "var(--text)", lineHeight: 1.5 }}>
                          <strong>Symptoms:</strong> {prescription.symptoms_notes}
                        </p>
                      )}
                    </div>
                    <button 
                      className={expandedPrescription === prescription.prescription_id ? "btn-main small" : "btn-soft small"}
                      onClick={() => loadMedications(prescription.prescription_id)}
                      style={{ whiteSpace: "nowrap" }}
                    >
                      {expandedPrescription === prescription.prescription_id ? "Hide Medications" : "View Medications"}
                    </button>
                  </div>

                  {expandedPrescription === prescription.prescription_id && (
                    <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px dashed var(--line)" }}>
                      <h4 style={{ margin: "0 0 16px 0", color: "var(--text)" }}>Prescribed Medications</h4>
                      
                      {!medicationsCache[prescription.prescription_id] ? (
                        <p className="muted" style={{ fontSize: "0.9rem" }}>Loading medications...</p>
                      ) : medicationsCache[prescription.prescription_id].length === 0 ? (
                        <p className="muted" style={{ fontSize: "0.9rem" }}>No medications found for this prescription.</p>
                      ) : (
                        <div className="grid-layout" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                          {medicationsCache[prescription.prescription_id].map((med) => (
                            <div key={med.patient_medication_id} style={{ background: "var(--bg)", border: "1px solid var(--line)", padding: 16, borderRadius: 12 }}>
                              <strong style={{ display: "block", color: "var(--text)", fontSize: "1.1rem", marginBottom: 8 }}>{med.medication_name}</strong>
                              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "0.9rem" }}>
                                <span style={{ color: "var(--text)", fontWeight: 500 }}><strong>Schedule:</strong> {formatDoseSchedule(med)}</span>
                                {(med.start_date || med.end_date) && (
                                  <span className="muted">
                                    {formatPrescriptionDate(med.start_date)} {med.end_date ? `→ ${formatPrescriptionDate(med.end_date)}` : ""}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: 60 }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📝</div>
              <p className="muted" style={{ fontSize: "1.1rem", margin: 0 }}>You don't have any prescriptions yet.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Prescriptions;
