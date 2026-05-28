import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { appointmentApi, vitalApi } from "../../utils/apiHelper";
import { patientsFromAppointments } from "../../utils/doctorPatients";
import { getStoredUser } from "../../utils/session";

const Vitals = () => {
  const user = getStoredUser();
  const [searchParams] = useSearchParams();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(
    searchParams.get("patient") || "",
  );
  const [vitals, setVitals] = useState([]);
  const [alerts, setAlerts] = useState([]);

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
    const loadPatientData = async () => {
      if (!selectedPatient) {
        setVitals([]);
        setAlerts([]);
        return;
      }

      try {
        const [vitalsResponse, alertsResponse] = await Promise.all([
          vitalApi.byPatient(selectedPatient),
          vitalApi.alerts(selectedPatient),
        ]);
        setVitals(vitalsResponse.data || []);
        setAlerts(alertsResponse.data || []);
      } catch (error) {
        console.error(error);
      }
    };

    loadPatientData();
  }, [selectedPatient]);

  const selectedPatientInfo = useMemo(
    () => patients.find((patient) => patient.user_id === selectedPatient),
    [patients, selectedPatient],
  );

  return (
    <>
      <section className="page-heading">
        <div>
          <h1>Patient Vitals & Alerts</h1>
          <p className="muted">
            Review vital signs and generated alerts without squeezing the chart into a side panel.
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

      <section className="record-grid">
        <div className="card record-panel">
          <div className="section-heading">
            <h3>Vital Recordings</h3>
            <span className="muted">{vitals.length} entries</span>
          </div>
          <div className="vital-grid">
            {vitals.length ? (
              vitals.map((vital) => (
                <div className="metric-card" key={vital.vital_id}>
                  <div>
                    <strong>Recording</strong>
                    <span className="muted">
                      {vital.recorded_at
                        ? new Date(vital.recorded_at).toLocaleString()
                        : "Date unknown"}
                    </span>
                  </div>
                  <div className="metric-list">
                    {vital.blood_pressure_systolic && (
                      <span>BP {vital.blood_pressure_systolic}/{vital.blood_pressure_diastolic} mmHg</span>
                    )}
                    {vital.heart_rate && <span>Heart {vital.heart_rate} bpm</span>}
                    {vital.glucose_level && <span>Glucose {vital.glucose_level} mg/dL</span>}
                    {vital.oxygen_saturation && <span>O2 {vital.oxygen_saturation}%</span>}
                    {vital.temperature && <span>Temp {vital.temperature} C</span>}
                    {vital.weight && <span>Weight {vital.weight} kg</span>}
                  </div>
                </div>
              ))
            ) : (
              <p className="muted">No vitals recorded for this patient.</p>
            )}
          </div>
        </div>

        <div className="card record-panel">
          <div className="section-heading">
            <h3>Health Alerts</h3>
            <span className="muted">{alerts.length} alerts</span>
          </div>
          <div className="list-stack">
            {alerts.length ? (
              alerts.map((alert) => (
                <div className="list-item alert-row" key={alert.alert_id}>
                  <div className="section-heading">
                    <strong>{alert.alert_type}</strong>
                    <span className={`severity-pill ${alert.severity === "high" ? "high" : "medium"}`}>
                      {alert.severity || "normal"}
                    </span>
                  </div>
                  <p>{alert.message}</p>
                  <p className="muted">
                    {alert.created_at ? new Date(alert.created_at).toLocaleString() : ""}
                  </p>
                </div>
              ))
            ) : (
              <p className="muted">No alerts for this patient.</p>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default Vitals;
