import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { appointmentApi, historyApi } from "../../utils/apiHelper";
import { patientsFromAppointments } from "../../utils/doctorPatients";
import { getStoredUser } from "../../utils/session";

const formatHistoryDate = (value) => {
  if (!value) return "Date not recorded";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not recorded";

  const rawValue = String(value);
  const hasOnlyMidnightTime =
    rawValue.includes("T00:00:00") ||
    rawValue.includes(" 00:00:00") ||
    (date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0);

  if (hasOnlyMidnightTime) {
    return date.toLocaleDateString();
  }

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
  const [searchParams] = useSearchParams();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(searchParams.get("patient") || "");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const loadPatients = async () => {
      try {
        if (!user?.id) return;
        const response = await appointmentApi.byDoctor(user.id);
        setPatients(patientsFromAppointments(response.data || []));
      } catch (error) {
        console.error(error);
      }
    };

    loadPatients();
  }, [user?.id]);

  useEffect(() => {
    const loadHistory = async () => {
      if (!selectedPatient) {
        setHistory([]);
        return;
      }

      try {
        const response = await historyApi.byPatient(selectedPatient);
        setHistory(response.data || []);
      } catch (error) {
        console.error(error);
      }
    };

    loadHistory();
  }, [selectedPatient]);

  return (
    <>
      <section className="page-heading">
        <div>
          <h1>Patient Medical History</h1>
          <p className="muted">View patient medical history timeline (read-only).</p>
        </div>
      </section>

      <section className="grid-layout two-col">
        <div className="card">
          <div className="section-heading"><h3>Select Patient</h3></div>
          <select value={selectedPatient} onChange={(event) => setSelectedPatient(event.target.value)}>
            <option value="">Choose a patient</option>
            {patients.map((patient) => (
              <option key={patient.user_id} value={patient.user_id}>{patient.full_name}</option>
            ))}
          </select>
        </div>

        <div className="card">
          <div className="section-heading"><h3>Medical Timeline</h3></div>
          <div className="list-stack">
            {history.length ? history.map((entry) => (
              <div className="list-item" key={entry.history_id}>
                <strong>{entry.title}</strong>
                <span style={{
                  display: "inline-block",
                  fontSize: "0.8em",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  backgroundColor: "#666",
                  color: "white",
                  marginTop: "4px"
                }}>
                  {entry.event_type}
                </span>
                <p>{entry.description || "No description provided"}</p>
                <p className="muted">{formatHistoryDate(entry.event_date)}</p>
              </div>
            )) : <p className="muted">No medical history for this patient.</p>}
          </div>
        </div>
      </section>
    </>
  );
};

export default MedicalHistory;
