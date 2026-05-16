import { useEffect, useMemo, useState } from "react";
import api, { vitalApi, getErrorMessage } from "../../utils/apiHelper";
import { getStoredUser } from "../../utils/session";

const Vitals = () => {
  const user = useMemo(() => getStoredUser(), []);
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    blood_pressure_systolic: "",
    blood_pressure_diastolic: "",
    heart_rate: "",
    glucose_level: "",
    weight_kg: "",
    temperature: ""
  });

  const loadVitals = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await vitalApi.getByPatient(user.id);
      setVitals(res.data || []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load vitals history."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVitals();
  }, [user?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/vitals", {
        patient_user_id: user.id,
        ...form,
      });
      setSuccess("Your vitals have been recorded successfully.");
      setForm({
        blood_pressure_systolic: "",
        blood_pressure_diastolic: "",
        heart_rate: "",
        glucose_level: "",
        weight_kg: "",
        temperature: ""
      });
      loadVitals();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save vitals."));
    } finally {
      setSubmitting(false);
    }
  };

  const latest = vitals[0] || {};

  return (
    <div className="page-shell">
      <section className="hero-panel">
        <div>
          <h1 className="eyebrow">Monitoring</h1>
          <h2>Vital Signs</h2>
          <p className="muted">
            Track your key health metrics regularly to help your medical team provide better care.
          </p>
        </div>
      </section>

      <div className="grid-layout two-col">
        {/* Left: Input Form */}
        <div style={{ display: "grid", gap: 20 }}>
          <section className="panel">
            <h3 style={{ marginBottom: 16 }}>Log New Reading</h3>
            <form className="form-grid" onSubmit={handleSubmit}>
              <div className="form-columns">
                <label>
                  BP Systolic (mmHg)
                  <input
                    type="number"
                    placeholder="e.g. 120"
                    value={form.blood_pressure_systolic}
                    onChange={(e) => setForm(p => ({ ...p, blood_pressure_systolic: e.target.value }))}
                    required
                  />
                </label>
                <label>
                  BP Diastolic (mmHg)
                  <input
                    type="number"
                    placeholder="e.g. 80"
                    value={form.blood_pressure_diastolic}
                    onChange={(e) => setForm(p => ({ ...p, blood_pressure_diastolic: e.target.value }))}
                    required
                  />
                </label>
              </div>
              <div className="form-columns">
                <label>
                  Heart Rate (BPM)
                  <input
                    type="number"
                    placeholder="e.g. 72"
                    value={form.heart_rate}
                    onChange={(e) => setForm(p => ({ ...p, heart_rate: e.target.value }))}
                    required
                  />
                </label>
                <label>
                  Glucose (mg/dL)
                  <input
                    type="number"
                    placeholder="e.g. 95"
                    value={form.glucose_level}
                    onChange={(e) => setForm(p => ({ ...p, glucose_level: e.target.value }))}
                  />
                </label>
              </div>
              <div className="form-columns">
                <label>
                  Weight (kg)
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 70.5"
                    value={form.weight_kg}
                    onChange={(e) => setForm(p => ({ ...p, weight_kg: e.target.value }))}
                  />
                </label>
                <label>
                  Temp (°C)
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 36.6"
                    value={form.temperature}
                    onChange={(e) => setForm(p => ({ ...p, temperature: e.target.value }))}
                  />
                </label>
              </div>
              
              {error && <p className="error-banner">{error}</p>}
              {success && <p className="alert alert-success">{success}</p>}
              
              <button type="submit" className="btn-main" disabled={submitting}>
                {submitting ? "Saving..." : "Record Vitals"}
              </button>
            </form>
          </section>

          {/* Quick Summary */}
          {vitals.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
               <div className="panel" style={{ textAlign: "center" }}>
                  <div className="muted" style={{ fontSize: 13, fontWeight: 700 }}>Last Blood Pressure</div>
                  <div style={{ fontSize: 24, fontWeight: 950, color: "var(--accent)", marginTop: 8 }}>
                    {latest.blood_pressure_systolic}/{latest.blood_pressure_diastolic}
                  </div>
               </div>
               <div className="panel" style={{ textAlign: "center" }}>
                  <div className="muted" style={{ fontSize: 13, fontWeight: 700 }}>Last Heart Rate</div>
                  <div style={{ fontSize: 24, fontWeight: 950, color: "var(--accent)", marginTop: 8 }}>
                    {latest.heart_rate} <small style={{ fontSize: 12 }}>BPM</small>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Right: History List */}
        <div style={{ display: "grid", gap: 20 }}>
          <section className="panel" style={{ minHeight: 400 }}>
            <h3 style={{ marginBottom: 20 }}>Historical Logs</h3>
            <div className="list-stack">
              {loading ? (
                <p className="muted" style={{ textAlign: "center", padding: 20 }}>Loading history...</p>
              ) : vitals.length ? vitals.map((v) => (
                <div key={v.vital_id} className="list-item" style={{ padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "grid", gap: 4 }}>
                      <strong style={{ fontSize: "1.2rem" }}>
                        {v.blood_pressure_systolic}/{v.blood_pressure_diastolic} <small className="muted" style={{ fontSize: 10 }}>mmHg</small>
                      </strong>
                      <div className="muted" style={{ fontSize: 13, fontWeight: 700 }}>
                        Blood Pressure
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                       <div style={{ fontWeight: 800 }}>{v.heart_rate} BPM</div>
                       <small className="muted">{new Date(v.measured_at).toLocaleDateString()}</small>
                    </div>
                  </div>
                  {(v.glucose_level || v.weight_kg) && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)", display: "flex", gap: 16 }}>
                      {v.glucose_level && <span style={{ fontSize: 12, fontWeight: 800 }}>🧪 Glucose: {v.glucose_level}</span>}
                      {v.weight_kg && <span style={{ fontSize: 12, fontWeight: 800 }}>⚖️ Weight: {v.weight_kg}kg</span>}
                    </div>
                  )}
                </div>
              )) : (
                <div style={{ textAlign: "center", padding: 40 }}>
                  <p className="muted">No vital logs recorded yet.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Vitals;
