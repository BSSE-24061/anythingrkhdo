import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { appointmentApi, medicationApi, prescriptionApi } from "../../utils/apiHelper";
import { patientsFromAppointments } from "../../utils/doctorPatients";
import { getStoredUser } from "../../utils/session";

const Prescriptions = () => {
  const user = getStoredUser();
  const [searchParams] = useSearchParams();
  const [patients, setPatients] = useState([]);
  const [medications, setMedications] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [prescriptionMedications, setPrescriptionMedications] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(searchParams.get("patient") || "");
  const [selectedPrescription, setSelectedPrescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [masterForm, setMasterForm] = useState({ diagnosis: "", diagnosis_notes: "", symptoms_notes: "", follow_up_date: "" });
  const [medForm, setMedForm] = useState({ medication_id: "", medicationName: "", dosage: "", frequency: "", start_date: "", end_date: "" });
  const [showRequestMedication, setShowRequestMedication] = useState(false);
  const [requestMedForm, setRequestMedForm] = useState({ name: "", type: "", description: "" });

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;

      try {
        const [appointmentsResponse, medicationsResponse] = await Promise.all([
          appointmentApi.byDoctor(user.id),
          medicationApi.list('approved'),
        ]);
        setPatients(patientsFromAppointments(appointmentsResponse.data || []));
        setMedications(medicationsResponse.data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.id]);

  useEffect(() => {
    const loadPatientPrescriptions = async () => {
      if (!selectedPatient) {
        setPrescriptions([]);
        setPrescriptionMedications([]);
        setSelectedPrescription("");
        return;
      }

      try {
        const response = await prescriptionApi.byPatient(selectedPatient);
        setPrescriptions(response.data || []);
      } catch (error) {
        console.error(error);
      }
    };

    loadPatientPrescriptions();
  }, [selectedPatient]);

  useEffect(() => {
    const loadPrescriptionMedications = async () => {
      if (!selectedPrescription) {
        setPrescriptionMedications([]);
        return;
      }

      try {
        const response = await prescriptionApi.byPrescription(selectedPrescription);
        setPrescriptionMedications(response.data || []);
      } catch (error) {
        console.error(error);
      }
    };

    loadPrescriptionMedications();
  }, [selectedPrescription]);

  const selectedPatientInfo = useMemo(
    () => patients.find((patient) => patient.user_id === selectedPatient),
    [patients, selectedPatient],
  );

  const formatPrescriptionDate = (value) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  };

  const createPrescription = async (event) => {
    event.preventDefault();

    try {
      const response = await prescriptionApi.createMaster({
        patient_user_id: selectedPatient,
        doctor_user_id: user.id,
        diagnosis: masterForm.diagnosis,
        diagnosis_notes: masterForm.diagnosis_notes,
        symptoms_notes: masterForm.symptoms_notes,
        follow_up_date: masterForm.follow_up_date || null,
      });

      const newPrescription = response.data?.prescription;
      setMasterForm({ diagnosis: "", diagnosis_notes: "", symptoms_notes: "", follow_up_date: "" });
      if (newPrescription?.prescription_id) {
        setSelectedPrescription(newPrescription.prescription_id);
      }

      const prescriptionsResponse = await prescriptionApi.byPatient(selectedPatient);
      setPrescriptions(prescriptionsResponse.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const addMedication = async (event) => {
    event.preventDefault();

    if (!selectedPrescription) {
      alert("Please choose a prescription before adding medication.");
      return;
    }

    if (!medForm.medication_id) {
      alert("Please select a valid medication from the search list.");
      return;
    }

    let medicationCreated = false;

    try {
      const response = await prescriptionApi.addMedication({
        prescription_id: selectedPrescription,
        patient_user_id: selectedPatient,
        medication_id: medForm.medication_id,
        dosage: medForm.dosage,
        frequency: medForm.frequency,
        start_date: medForm.start_date || null,
        end_date: medForm.end_date || null,
      });

      const patientMedicationId = response.data?.medication?.patient_medication_id;
      if (!patientMedicationId) {
        throw new Error("Unable to determine patient medication ID after adding medication.");
      }

      medicationCreated = true;

      const medResponse = await prescriptionApi.byPrescription(selectedPrescription);
      setPrescriptionMedications(medResponse.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      if (medicationCreated) {
        setMedForm({ medication_id: "", medicationName: "", dosage: "", frequency: "", start_date: "", end_date: "" });
      }
    }
  };

  const requestNewMedication = async (event) => {
    event.preventDefault();
    try {
      await medicationApi.create({
        name: requestMedForm.name,
        type: requestMedForm.type,
        description: requestMedForm.description,
        status: "pending"
      });
      alert("Medication requested successfully! An admin will review it.");
      setRequestMedForm({ name: "", type: "", description: "" });
      setShowRequestMedication(false);
    } catch (error) {
      console.error(error);
      alert("Failed to request medication.");
    }
  };

  return (
    <>
      <section className="page-heading">
        <div>
          <h1>Prescriptions</h1>
          <p className="muted">Create a prescription, add medications, and attach treatment logs.</p>
        </div>
      </section>

      <section className="grid-layout two-col">
        <div className="card">
          <div className="section-heading">
            <h3>Patient</h3>
          </div>

          <select value={selectedPatient} onChange={(event) => setSelectedPatient(event.target.value)}>
            <option value="">Choose a patient</option>
            {patients.map((patient) => (
              <option key={patient.user_id} value={patient.user_id}>{patient.full_name}</option>
            ))}
          </select>

          <form className="form-grid" onSubmit={createPrescription}>
            <input value={masterForm.diagnosis} onChange={(event) => setMasterForm((current) => ({ ...current, diagnosis: event.target.value }))} placeholder="Diagnosis" required />
            <textarea rows="3" value={masterForm.diagnosis_notes} onChange={(event) => setMasterForm((current) => ({ ...current, diagnosis_notes: event.target.value }))} placeholder="Diagnosis notes" />
            <textarea rows="3" value={masterForm.symptoms_notes} onChange={(event) => setMasterForm((current) => ({ ...current, symptoms_notes: event.target.value }))} placeholder="Symptoms notes" />
            <label>
              Follow-up Date
              <input type="date" value={masterForm.follow_up_date} onChange={(event) => setMasterForm((current) => ({ ...current, follow_up_date: event.target.value }))} />
            </label>
            <button type="submit" className="btn-main">Create Prescription</button>
          </form>
        </div>

        <div className="card">
          <div className="section-heading">
            <h3>Prescription Medications</h3>
          </div>

          <select value={selectedPrescription} onChange={(event) => setSelectedPrescription(event.target.value)}>
            <option value="">Choose a prescription</option>
            {prescriptions.map((prescription) => (
              <option key={prescription.prescription_id} value={prescription.prescription_id}>
                {prescription.diagnosis} - {new Date(prescription.prescribed_at).toLocaleDateString()}
              </option>
            ))}
          </select>

          <form className="form-grid" onSubmit={addMedication} style={{ marginTop: 14 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", position: "relative" }}>
              <div style={{ flex: 1 }}>
                <input
                  list="medications-list"
                  placeholder="Search for a medication..."
                  value={medForm.medicationName || ""}
                  onChange={(e) => {
                    const name = e.target.value;
                    const med = medications.find(m => m.name === name);
                    setMedForm(current => ({ 
                      ...current, 
                      medicationName: name, 
                      medication_id: med ? med.medication_id : "" 
                    }));
                  }}
                  required
                />
                <datalist id="medications-list">
                  {medications.map((medication) => (
                    <option key={medication.medication_id} value={medication.name} />
                  ))}
                </datalist>
              </div>
              <button type="button" className="btn-soft" style={{ padding: "12px", whiteSpace: "nowrap" }} onClick={() => setShowRequestMedication(!showRequestMedication)}>
                {showRequestMedication ? "Cancel Request" : "Not Found? Request"}
              </button>
            </div>
            
            {showRequestMedication && (
              <div style={{ background: "rgba(2, 132, 199, 0.05)", padding: 16, borderRadius: 12, border: "1px dashed rgba(2, 132, 199, 0.3)", marginBottom: 16 }}>
                <h4 style={{ margin: "0 0 12px 0", color: "var(--text)" }}>Request New Medication</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <input value={requestMedForm.name} onChange={(e) => setRequestMedForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Medication Name" required />
                  <input value={requestMedForm.type} onChange={(e) => setRequestMedForm(prev => ({ ...prev, type: e.target.value }))} placeholder="Type (e.g. Tablet, Syrup)" />
                  <textarea rows="2" value={requestMedForm.description} onChange={(e) => setRequestMedForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Description/Reason for request" />
                  <button type="button" onClick={requestNewMedication} className="btn-main small" style={{ width: "fit-content" }}>Submit Request</button>
                </div>
              </div>
            )}

            <div className="form-columns">
              <input value={medForm.dosage} onChange={(event) => setMedForm((current) => ({ ...current, dosage: event.target.value }))} placeholder="Dosage" required />
              <input value={medForm.frequency} onChange={(event) => setMedForm((current) => ({ ...current, frequency: event.target.value }))} placeholder="Frequency" required />
            </div>
            <div className="form-columns">
              <input type="date" value={medForm.start_date} onChange={(event) => setMedForm((current) => ({ ...current, start_date: event.target.value }))} />
              <input type="date" value={medForm.end_date} onChange={(event) => setMedForm((current) => ({ ...current, end_date: event.target.value }))} />
            </div>
            <button type="submit" className="btn-soft">Add Medication + Log</button>
          </form>
        </div>
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <div className="section-heading">
          <h3>Prescription History {selectedPatientInfo ? `for ${selectedPatientInfo.full_name}` : ""}</h3>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : prescriptions.length ? (
          <div className="list-stack">
            {prescriptions.map((prescription) => (
              <div className="list-item" key={prescription.prescription_id}>
                <strong>{prescription.diagnosis}</strong>
                <span>{new Date(prescription.prescribed_at).toLocaleString()}</span>
                <p>{prescription.diagnosis_notes || "No notes"}</p>
                <p className="muted">Follow-up: {formatPrescriptionDate(prescription.follow_up_date)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">No prescriptions found for this patient.</p>
        )}

        {selectedPrescription && (
          <div style={{ marginTop: 24 }}>
            <div className="section-heading">
              <h3>Prescription Medications</h3>
            </div>
            <div className="list-stack">
              {prescriptionMedications.map((item) => (
                <div className="list-item" key={item.patient_medication_id}>
                  <strong>{item.medication_name}</strong>
                  <span>{item.dosage} • {item.frequency}</span>
                  <p className="muted">{item.start_date || ""} {item.end_date ? `→ ${item.end_date}` : ""}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default Prescriptions;
