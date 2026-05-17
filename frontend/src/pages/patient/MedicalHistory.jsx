import { useEffect, useState } from "react";
import { historyApi, getErrorMessage } from "../../utils/apiHelper";
import { getStoredUser } from "../../utils/session";

const MedicalHistory = () => {
  const user = getStoredUser();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const loadHistory = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const response = await historyApi.getByPatient(user.id);
      setHistory(response.data || []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load medical history."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filteredHistory = history.filter(item => {
    if (filter === "all") return true;
    return item.event_type?.toLowerCase().includes(filter.toLowerCase());
  });

  return (
    <div className="page-shell">
      <section className="hero-panel">
        <div>
          <h1 className="eyebrow">Medical Records</h1>
          <h2>Patient History</h2>
          <p className="muted">
            A comprehensive timeline of your medical journey, including appointments, diagnoses, and treatments.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, alignSelf: "end", marginBottom: 8 }}>
           <select 
             value={filter} 
             onChange={(e) => setFilter(e.target.value)}
             className="btn-ghost"
             style={{ padding: "8px 16px", borderRadius: 12 }}
           >
             <option value="all">All Events</option>
             <option value="Appointment">Appointments</option>
             <option value="Diagnosis">Diagnoses</option>
             <option value="Surgery">Surgeries</option>
             <option value="Lab">Lab Results</option>
           </select>
        </div>
      </section>

      {error && <p className="error-banner">{error}</p>}

      <div className="grid-layout" style={{ gridTemplateColumns: "1fr" }}>
        <section className="panel" style={{ position: "relative" }}>
          {loading ? (
            <p className="muted" style={{ textAlign: "center", padding: 40 }}>Retrieving records...</p>
          ) : filteredHistory.length ? (
            <div className="timeline-container" style={{ paddingLeft: 20, borderLeft: "2px solid var(--line)", marginLeft: 20 }}>
              {filteredHistory.map((item, index) => (
                <div key={item.history_id || index} style={{ position: "relative", marginBottom: 32 }}>
                  <div style={{ 
                    position: "absolute", 
                    left: -31, 
                    top: 0, 
                    width: 20, 
                    height: 20, 
                    borderRadius: "50%", 
                    background: "var(--accent)", 
                    border: "4px solid #fff",
                    boxShadow: "0 0 0 2px var(--line)"
                  }} />
                  
                  <div className="list-item" style={{ padding: 24 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <div>
                        <span className="status-pill status-open" style={{ marginBottom: 12, background: "rgba(0, 86, 179, 0.08)", color: "var(--accent)" }}>
                          {item.event_type}
                        </span>
                        <h3 style={{ fontSize: "1.4rem", margin: "8px 0" }}>{item.title}</h3>
                        <p style={{ fontSize: "1.1rem", color: "var(--text)", lineHeight: 1.5 }}>{item.description}</p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 800, color: "var(--text)" }}>{new Date(item.event_date).toLocaleDateString()}</div>
                        <small className="muted">{new Date(item.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                      </div>
                    </div>
                    {item.related_doctor_name && (
                      <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "grid", placeItems: "center", fontSize: 10 }}>Dr</div>
                        <span className="muted" style={{ fontWeight: 700 }}>Recorded by Dr. {item.related_doctor_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: 60 }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
              <p className="muted" style={{ fontSize: "1.1rem" }}>No medical history events found for this filter.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default MedicalHistory;
