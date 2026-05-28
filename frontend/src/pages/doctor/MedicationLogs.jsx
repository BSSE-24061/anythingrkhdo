import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { appointmentApi, medicationApi } from "../../utils/apiHelper";
import { patientsFromAppointments } from "../../utils/doctorPatients";
import { getStoredUser } from "../../utils/session";

const DOSE_LABELS = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

const MedicationLogs = () => {
  const user = getStoredUser();
  const [searchParams] = useSearchParams();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(
    searchParams.get("patient") || "",
  );
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

  const selectedPatientInfo = useMemo(
    () => patients.find((patient) => patient.user_id === selectedPatient),
    [patients, selectedPatient],
  );

  const totals = useMemo(
    () => ({
      taken: logs.filter((log) => log.status === "taken").length,
      missed: logs.filter((log) => log.status === "missed").length,
      pending: logs.filter((log) => log.status === "pending").length,
    }),
    [logs],
  );

  return (
    <>
      <section className="page-heading">
        <div>
          <h1>Medication Logs</h1>
          <p className="muted">
            Review medication adherence across the full page, grouped with quick status counts.
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

      <section className="doctor-stats">
        <div className="stat-card">
          <span className="muted">Taken</span>
          <strong>{totals.taken}</strong>
        </div>
        <div className="stat-card">
          <span className="muted">Pending</span>
          <strong>{totals.pending}</strong>
        </div>
        <div className="stat-card">
          <span className="muted">Missed</span>
          <strong>{totals.missed}</strong>
        </div>
      </section>

      <section className="card record-panel">
        <div className="section-heading">
          <h3>Medication Timeline</h3>
          <span className="muted">{logs.length} logs</span>
        </div>
        <div className="resource-grid compact">
          {logs.length ? (
            logs.map((log) => (
              <div className="metric-card" key={log.log_id}>
                <div className="section-heading">
                  <strong>{log.medication_name || "Medication"}</strong>
                  <span className={`severity-pill ${log.status}`}>
                    {log.status || "pending"}
                  </span>
                </div>
                <p>
                  {DOSE_LABELS[log.dose_period] || "Scheduled"} dose:{" "}
                  {log.dose_dosage || log.dosage || "Dose not specified"}
                </p>
                <p className="muted">
                  Scheduled:{" "}
                  {log.scheduled_time
                    ? new Date(log.scheduled_time).toLocaleString()
                    : "N/A"}
                </p>
                {log.status === "taken" && log.taken_at && (
                  <p className="success-text">
                    Taken at: {new Date(log.taken_at).toLocaleString()}
                  </p>
                )}
              </div>
            ))
          ) : (
            <p className="muted">No medication logs for this patient.</p>
          )}
        </div>
      </section>
    </>
  );
};

export default MedicationLogs;
