import { useEffect, useMemo, useState } from "react";
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
    (date.getHours() === 0 &&
      date.getMinutes() === 0 &&
      date.getSeconds() === 0);

  if (hasOnlyMidnightTime) return date.toLocaleDateString();

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
  const [selectedPatient, setSelectedPatient] = useState(
    searchParams.get("patient") || "",
  );
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

  const selectedPatientInfo = useMemo(
    () => patients.find((patient) => patient.user_id === selectedPatient),
    [patients, selectedPatient],
  );

  return (
    <>
      <section className="page-heading">
        <div>
          <h1>Patient Medical History</h1>
          <p className="muted">
            A full-width timeline for appointments, prescriptions, and care events.
          </p>
        </div>
      </section>

      <section className="record-selector card">
        <div>
          <div className="section-heading">
            <h3>Select Patient</h3>
          </div>
          <select
            value={selectedPatient}
            onChange={(event) => setSelectedPatient(event.target.value)}
          >
            <option value="">Choose a patient</option>
            {patients.map((patient) => (
              <option key={patient.user_id} value={patient.user_id}>
                {patient.full_name}
              </option>
            ))}
          </select>
        </div>
        {selectedPatientInfo && (
          <div className="patient-summary">
            <strong>{selectedPatientInfo.full_name}</strong>
            <span>{selectedPatientInfo.email || "No email available"}</span>
            <span>{selectedPatientInfo.phone || "No phone number"}</span>
          </div>
        )}
      </section>

      <section className="card record-panel">
        <div className="section-heading">
          <h3>Medical Timeline</h3>
          <span className="muted">{history.length} events</span>
        </div>
        <div className="timeline-list">
          {history.length ? (
            history.map((entry) => (
              <div className="timeline-item" key={entry.history_id}>
                <div className="timeline-dot" />
                <div className="timeline-card">
                  <div className="section-heading">
                    <div>
                      <span className="status-pill status-open">
                        {entry.event_type}
                      </span>
                      <h3>{entry.title}</h3>
                    </div>
                    <span className="muted">{formatHistoryDate(entry.event_date)}</span>
                  </div>
                  <p>{entry.description || "No description provided"}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="muted">No medical history for this patient.</p>
          )}
        </div>
      </section>
    </>
  );
};

export default MedicalHistory;
