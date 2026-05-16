import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { appointmentApi } from "../../utils/apiHelper";
import { patientsFromAppointments } from "../../utils/doctorPatients";
import { getStoredUser } from "../../utils/session";

const Patients = () => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [patients, setPatients] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        if (!user?.id) return;
        const response = await appointmentApi.byDoctor(user.id);
        setPatients(patientsFromAppointments(response.data || []));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.id]);

  const filteredPatients = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return patients;
    return patients.filter((patient) =>
      [patient.full_name, patient.email, patient.phone].some((value) =>
        String(value || "").toLowerCase().includes(term),
      ),
    );
  }, [patients, query]);

  return (
    <>
      <section className="page-heading">
        <div>
          <h1>Patients</h1>
          <p className="muted">Open a patient profile to review history, vitals, prescriptions, or chat.</p>
        </div>
      </section>

      <div className="card" style={{ marginBottom: 20 }}>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search patients..." />
      </div>

      <section className="list-stack">
        {loading ? (
          <p>Loading patients...</p>
        ) : (
          filteredPatients.map((patient) => (
            <div className="card" key={patient.user_id}>
              <div className="section-heading">
                <div>
                  <h3>{patient.full_name}</h3>
                  <span>{patient.email || "No email available"}</span>
                </div>
                <span className="page-tag">{patient.gender || "unknown"}</span>
              </div>

              <p>{patient.phone || "No phone number"}</p>

              <div className="inline-actions wrap">
                <button className="btn-main small" onClick={() => navigate(`/doctor/history?patient=${patient.user_id}`)}>History</button>
                <button className="btn-soft small" onClick={() => navigate(`/doctor/vitals?patient=${patient.user_id}`)}>Vitals</button>
                <button className="btn-soft small" onClick={() => navigate(`/doctor/prescriptions?patient=${patient.user_id}`)}>Prescriptions</button>
                <button className="btn-soft small" onClick={() => navigate(`/doctor/medication-logs?patient=${patient.user_id}`)}>Medication Logs</button>
                <button className="btn-soft small" onClick={() => navigate(`/doctor/chat?patient=${patient.user_id}`)}>Chat</button>
              </div>
            </div>
          ))
        )}
      </section>
    </>
  );
};

export default Patients;
