import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { appointmentApi, medicationApi } from "../../utils/apiHelper";
import { patientsFromAppointments } from "../../utils/doctorPatients";
import { getStoredUser } from "../../utils/session";

const MedicationLogs = () => {
  const user = getStoredUser();
  const [searchParams] = useSearchParams();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(searchParams.get("patient") || "");
  const [logs, setLogs] = useState([]);

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
    const loadLogs = async () => {
      if (!selectedPatient) {
        setLogs([]);
        return;
      }

      try {
        const response = await medicationApi.byPatientLogs(selectedPatient);
        setLogs(response.data || []);
      } catch (error) {
        console.error(error);
      }
    };

    loadLogs();
  }, [selectedPatient]);

  return (
    <>
      <section className="page-heading">
        <div>
          <h1>Medication Logs</h1>
          <p className="muted">View patient medication adherence and history (read-only).</p>
        </div>
      </section>

      <section className="grid-layout two-col">
        <div className="card">
          <div className="section-heading">
            <h3>Select Patient</h3>
          </div>
          <select value={selectedPatient} onChange={(event) => setSelectedPatient(event.target.value)}>
            <option value="">Choose a patient</option>
            {patients.map((patient) => (
              <option key={patient.user_id} value={patient.user_id}>{patient.full_name}</option>
            ))}
          </select>
        </div>

        <div className="card">
          <div className="section-heading">
            <h3>Medication Logs</h3>
          </div>
          <div className="list-stack">
            {logs.length ? logs.map((log) => (
              <div className="list-item" key={log.log_id}>
                <strong>{log.medication_name || "Medication"}</strong>
                <span style={{
                  display: "inline-block",
                  fontSize: "0.8em",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  backgroundColor: log.status === "taken" ? "#44aa44" : log.status === "missed" ? "#aa4444" : "#4444aa",
                  color: "white",
                  marginTop: "4px"
                }}>
                  {log.status?.toUpperCase()}
                </span>
                <p>Scheduled: {log.scheduled_time ? new Date(log.scheduled_time).toLocaleString() : "N/A"}</p>
                {log.status === "taken" && log.taken_at && (
                  <p style={{ color: "#44aa44", fontWeight: 600, marginTop: 4 }}>
                    Taken at: {new Date(log.taken_at).toLocaleString()}
                  </p>
                )}
              </div>
            )) : <p className="muted">No medication logs for this patient.</p>}
          </div>
        </div>
      </section>
    </>
  );
};

export default MedicationLogs;
