import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { appointmentApi, vitalApi } from "../../utils/apiHelper";
import { patientsFromAppointments } from "../../utils/doctorPatients";
import { getStoredUser } from "../../utils/session";

const Vitals = () => {
  const user = getStoredUser();
  const [searchParams] = useSearchParams();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(searchParams.get("patient") || "");
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

  return (
    <>
      <section className="page-heading">
        <div>
          <h1>Patient Vitals & Alerts</h1>
          <p className="muted">View patient vital signs and generated health alerts (read-only).</p>
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

          <div className="section-heading" style={{ marginTop: 20 }}>
            <h3>Patient Vitals</h3>
          </div>
          <div className="list-stack">
            {vitals.length ? vitals.map((vital) => (
              <div className="list-item" key={vital.vital_id}>
                <strong>Vital Recording</strong>
                <p className="muted">{vital.recorded_at ? new Date(vital.recorded_at).toLocaleString() : "Date unknown"}</p>
                <div style={{ fontSize: "0.9em", lineHeight: "1.8" }}>
                  {vital.blood_pressure_systolic && <p>BP: {vital.blood_pressure_systolic}/{vital.blood_pressure_diastolic} mmHg</p>}
                  {vital.heart_rate && <p>Heart Rate: {vital.heart_rate} bpm</p>}
                  {vital.glucose_level && <p>Glucose: {vital.glucose_level} mg/dL</p>}
                  {vital.oxygen_saturation && <p>O₂ Sat: {vital.oxygen_saturation}%</p>}
                  {vital.temperature && <p>Temperature: {vital.temperature}°C</p>}
                  {vital.weight && <p>Weight: {vital.weight} kg</p>}
                </div>
              </div>
            )) : <p className="muted">No vitals recorded for this patient.</p>}
          </div>
        </div>

        <div className="card">
          <div className="section-heading">
            <h3>Health Alerts</h3>
          </div>
          <div className="list-stack">
            {alerts.length ? alerts.map((alert) => (
              <div className="list-item" key={alert.alert_id}>
                <strong>{alert.alert_type}</strong>
                <span style={{
                  display: "inline-block",
                  fontSize: "0.8em",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  backgroundColor: alert.severity === "high" ? "#ff4444" : "#ffaa00",
                  color: "white",
                  marginTop: "4px"
                }}>
                  {alert.severity?.toUpperCase()}
                </span>
                <p>{alert.message}</p>
                <p className="muted">{alert.created_at ? new Date(alert.created_at).toLocaleString() : ""}</p>
              </div>
            )) : <p className="muted">No alerts for this patient.</p>}
          </div>
        </div>
      </section>
    </>
  );
};

export default Vitals;
