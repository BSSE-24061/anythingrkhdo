import { useEffect, useState } from "react";

import { historyApi, getErrorMessage } from "../../utils/apiHelper";
import { getStoredUser } from "../../utils/session";

const formatHistoryDate = (value) => {
  if (!value) return "Date not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not recorded";
  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

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

  const filteredHistory = history.filter((item) => {
    if (filter === "all") return true;
    const type = item.event_type?.toLowerCase() || "";
    
    if (filter === "appointment") {
      return type.includes("appointment");
    }
    if (filter === "alert") {
      return type.includes("alert");
    }
    if (filter === "medication") {
      return type.includes("medication") || type.includes("log");
    }
    if (filter === "diagnosis") {
      return type.includes("diagnosis") || type.includes("prescription") || type.includes("disease");
    }
    
    return type.includes(filter.toLowerCase());
  });

  return (
    <div className="page-shell">
      <section className="hero-panel records-hero">
        <div>
          <h1 className="eyebrow">Medical Records</h1>
          <h2>Patient History</h2>
          <p className="muted">
            A clean timeline of appointments, diagnoses, prescriptions, and care events.
          </p>
        </div>
        <div className="hero-actions">
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">All Events</option>
            <option value="appointment">Appointments</option>
            <option value="alert">Alerts</option>
            <option value="medication">Medication Logs</option>
            <option value="diagnosis">Diagnosis</option>
          </select>
        </div>
      </section>

      {error && <p className="error-banner">{error}</p>}

      <section className="panel record-panel">
        <div className="section-heading">
          <h3>Timeline</h3>
          <span className="muted">{filteredHistory.length} events</span>
        </div>

        {loading ? (
          <p className="muted empty-panel">Retrieving records...</p>
        ) : filteredHistory.length ? (
          <div className="timeline-list">
            {filteredHistory.map((item, index) => (
              <div className="timeline-item" key={item.history_id || index}>
                <div className="timeline-dot" />
                <div className="timeline-card">
                  <div className="section-heading">
                    <div>
                      <span className="status-pill status-open">
                        {item.event_type}
                      </span>
                      <h3>{item.title}</h3>
                    </div>
                    <span className="muted">{formatHistoryDate(item.event_date)}</span>
                  </div>
                  <p>{item.description || "No description provided."}</p>
                  {item.related_doctor_name && (
                    <p className="muted">Recorded by Dr. {item.related_doctor_name}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted empty-panel">No medical history events found for this filter.</p>
        )}
      </section>
    </div>
  );
};

export default MedicalHistory;
