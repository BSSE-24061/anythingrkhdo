import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import {
  appointmentApi,
  medicationApi,
  prescriptionApi,
} from "../../utils/apiHelper";
import { patientsFromAppointments } from "../../utils/doctorPatients";
import { getStoredUser } from "../../utils/session";
import { formatIslamabadDateTime } from "../../utils/dateTime";

const DOSE_PERIODS = [
  { key: "morning", label: "Morning" },
  { key: "afternoon", label: "Afternoon" },
  { key: "evening", label: "Evening" },
];

const emptyMedicationForm = {
  medication_id: "",
  medicationName: "",
  dosage_schedule: { morning: "", afternoon: "", evening: "" },
  start_date: "",
  end_date: "",
};

const Prescriptions = () => {
  const user = getStoredUser();
  const [searchParams] = useSearchParams();
  const [patients, setPatients] = useState([]);
  const [medications, setMedications] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [prescriptionMedications, setPrescriptionMedications] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(
    searchParams.get("patient") || "",
  );
  const [selectedAppointment, setSelectedAppointment] = useState(
    searchParams.get("appointment") || "",
  );
  const [selectedPrescription, setSelectedPrescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [masterForm, setMasterForm] = useState({
    diagnosis: "",
    diagnosis_notes: "",
    symptoms_notes: "",
    follow_up_date: "",
  });
  const [medForm, setMedForm] = useState(emptyMedicationForm);
  const [showRequestMedication, setShowRequestMedication] = useState(false);
  const [requestMedForm, setRequestMedForm] = useState({
    name: "",
    type: "",
    description: "",
  });

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;

      try {
        const [appointmentsResponse, medicationsResponse] = await Promise.all([
          appointmentApi.byDoctor(user.id),
          medicationApi.list("approved"),
        ]);
        setAppointments(appointmentsResponse.data || []);
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
        setSelectedAppointment("");
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
        const response =
          await prescriptionApi.byPrescription(selectedPrescription);
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

  // Get all (pending, confirmed) appointments for the selected patient - exclude completed
  const availableAppointments = useMemo(() => {
    return appointments.filter(
      (apt) =>
        apt.patient_user_id === selectedPatient && apt.status !== "completed",
    );
  }, [appointments, selectedPatient]);

  // Get the selected appointment details
  const selectedAppointmentData = useMemo(() => {
    return appointments.find(
      (apt) => apt.appointment_id === selectedAppointment,
    );
  }, [appointments, selectedAppointment]);

  // Check if current time is at or after appointment start time
  const isAppointmentTimeReached = useMemo(() => {
    if (!selectedAppointmentData) return false;
    const appointmentStart = new Date(selectedAppointmentData.scheduled_at);
    return new Date() >= appointmentStart;
  }, [selectedAppointmentData]);

  // Check if prescription can be created
  const canCreatePrescription = useMemo(() => {
    return (
      selectedPatient &&
      selectedAppointment &&
      selectedAppointmentData?.status !== "completed" &&
      isAppointmentTimeReached
    );
  }, [
    selectedPatient,
    selectedAppointment,
    selectedAppointmentData,
    isAppointmentTimeReached,
  ]);

  // Get message about why prescription cannot be created
  const prescriptionDisabledMessage = useMemo(() => {
    if (!selectedPatient) return "Select a patient first";
    if (!selectedAppointment) return "Select an appointment";
    if (selectedAppointmentData?.status === "completed") {
      return "Cannot prescribe - appointment has been marked as done";
    }
    if (!isAppointmentTimeReached) {
      const appointmentTime = new Date(selectedAppointmentData?.scheduled_at);
      return `Prescription available from ${formatIslamabadDateTime(appointmentTime)}`;
    }
    return "";
  }, [
    selectedPatient,
    selectedAppointment,
    selectedAppointmentData,
    isAppointmentTimeReached,
  ]);

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

  const formatDoseSchedule = (item) => {
    if (item.dosage_schedule && typeof item.dosage_schedule === "object") {
      return Object.entries(item.dosage_schedule)
        .map(
          ([period, dose]) =>
            `${period.charAt(0).toUpperCase() + period.slice(1)}: ${dose}`,
        )
        .join(" • ");
    }

    return item.dosage || "Dosage not specified";
  };

  const createPrescription = async (event) => {
    event.preventDefault();

    if (!canCreatePrescription) {
      alert(prescriptionDisabledMessage || "Cannot create prescription");
      return;
    }

    if (masterForm.follow_up_date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const followUp = new Date(masterForm.follow_up_date);
      followUp.setHours(0, 0, 0, 0);
      if (followUp < today) {
        alert("Follow-up date cannot be before the current date.");
        return;
      }
    }

    try {
      const response = await prescriptionApi.createMaster({
        patient_user_id: selectedPatient,
        doctor_user_id: user.id,
        appointment_id: selectedAppointment,
        diagnosis: masterForm.diagnosis,
        diagnosis_notes: masterForm.diagnosis_notes,
        symptoms_notes: masterForm.symptoms_notes,
        follow_up_date: masterForm.follow_up_date || null,
      });

      const newPrescription = response.data?.prescription;
      setMasterForm({
        diagnosis: "",
        diagnosis_notes: "",
        symptoms_notes: "",
        follow_up_date: "",
      });
      if (newPrescription?.prescription_id) {
        setSelectedPrescription(newPrescription.prescription_id);
      }

      const prescriptionsResponse =
        await prescriptionApi.byPatient(selectedPatient);
      setPrescriptions(prescriptionsResponse.data || []);
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.error || "Failed to create prescription");
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

    if (medForm.start_date && medForm.end_date) {
      const start = new Date(medForm.start_date);
      const end = new Date(medForm.end_date);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      if (end < start) {
        alert("Ending date cannot be before the starting date.");
        return;
      }
    }

    const dosageSchedule = Object.fromEntries(
      Object.entries(medForm.dosage_schedule).filter(([, value]) =>
        value.trim(),
      ),
    );

    if (Object.keys(dosageSchedule).length === 0) {
      alert("Please enter dosage for at least one timing.");
      return;
    }

    let medicationCreated = false;

    try {
      const response = await prescriptionApi.addMedication({
        prescription_id: selectedPrescription,
        patient_user_id: selectedPatient,
        medication_id: medForm.medication_id,
        dosage_schedule: dosageSchedule,
        start_date: medForm.start_date || null,
        end_date: medForm.end_date || null,
      });

      const patientMedicationId =
        response.data?.medication?.patient_medication_id;
      if (!patientMedicationId) {
        throw new Error(
          "Unable to determine patient medication ID after adding medication.",
        );
      }

      medicationCreated = true;

      const medResponse =
        await prescriptionApi.byPrescription(selectedPrescription);
      setPrescriptionMedications(medResponse.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      if (medicationCreated) {
        setMedForm(emptyMedicationForm);
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
        status: "pending",
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
          <p className="muted">
            Create a prescription, add medications, and attach treatment logs.
          </p>
        </div>
      </section>

      <section className="grid-layout two-col">
        <div className="card">
          <div className="section-heading">
            <h3>Patient</h3>
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

          {selectedPatient && (
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontWeight: 800,
                  fontSize: 13,
                  color: "#475569",
                }}
              >
                Appointment (ongoing appointments only)
              </label>
              <select
                value={selectedAppointment}
                onChange={(event) => setSelectedAppointment(event.target.value)}
                style={{ width: "100%" }}
              >
                <option value="">Select an ongoing appointment</option>
                {availableAppointments.length === 0 ? (
                  <option disabled>No ongoing appointments</option>
                ) : (
                  availableAppointments.map((apt) => (
                    <option key={apt.appointment_id} value={apt.appointment_id}>
                      {formatIslamabadDateTime(apt.scheduled_at)} -{" "}
                      {apt.reason || "Consultation"}
                    </option>
                  ))
                )}
              </select>
              {availableAppointments.length === 0 && (
                <p style={{ fontSize: 12, color: "#ef4444", marginTop: 6 }}>
                  No ongoing appointments. Complete an appointment first to
                  prescribe.
                </p>
              )}
            </div>
          )}

          {selectedAppointment && !canCreatePrescription && (
            <div
              style={{
                padding: 12,
                background: "#fef3c7",
                border: "1px solid #fcd34d",
                borderRadius: 8,
                marginBottom: 16,
                fontSize: 13,
                color: "#92400e",
                fontWeight: 600,
              }}
            >
              ⚠️ {prescriptionDisabledMessage}
            </div>
          )}

          <form className="form-grid" onSubmit={createPrescription}>
            <input
              value={masterForm.diagnosis}
              onChange={(event) =>
                setMasterForm((current) => ({
                  ...current,
                  diagnosis: event.target.value,
                }))
              }
              placeholder="Diagnosis"
              required
            />
            <textarea
              rows="3"
              value={masterForm.diagnosis_notes}
              onChange={(event) =>
                setMasterForm((current) => ({
                  ...current,
                  diagnosis_notes: event.target.value,
                }))
              }
              placeholder="Diagnosis notes"
            />
            <textarea
              rows="3"
              value={masterForm.symptoms_notes}
              onChange={(event) =>
                setMasterForm((current) => ({
                  ...current,
                  symptoms_notes: event.target.value,
                }))
              }
              placeholder="Symptoms notes"
            />
            <label>
              Follow-up Date
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={masterForm.follow_up_date}
                onChange={(event) =>
                  setMasterForm((current) => ({
                    ...current,
                    follow_up_date: event.target.value,
                  }))
                }
              />
            </label>
            <button
              type="submit"
              className="btn-main"
              disabled={!canCreatePrescription}
              title={
                !canCreatePrescription
                  ? prescriptionDisabledMessage
                  : "Create prescription"
              }
              style={{
                opacity: !canCreatePrescription ? 0.5 : 1,
                cursor: !canCreatePrescription ? "not-allowed" : "pointer",
              }}
            >
              Create Prescription
            </button>
          </form>
        </div>

        <div className="card">
          <div className="section-heading">
            <h3>Prescription Medications</h3>
          </div>

          <select
            value={selectedPrescription}
            onChange={(event) => setSelectedPrescription(event.target.value)}
          >
            <option value="">Choose a prescription</option>
            {prescriptions.map((prescription) => (
              <option
                key={prescription.prescription_id}
                value={prescription.prescription_id}
              >
                {prescription.diagnosis} -{" "}
                {new Date(prescription.prescribed_at).toLocaleDateString()}
              </option>
            ))}
          </select>

          <form
            className="form-grid"
            onSubmit={addMedication}
            style={{ marginTop: 14 }}
          >
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                position: "relative",
              }}
            >
              <div style={{ flex: 1 }}>
                <input
                  list="medications-list"
                  placeholder="Search for a medication..."
                  value={medForm.medicationName || ""}
                  onChange={(e) => {
                    const name = e.target.value;
                    const med = medications.find((m) => m.name === name);
                    setMedForm((current) => ({
                      ...current,
                      medicationName: name,
                      medication_id: med ? med.medication_id : "",
                    }));
                  }}
                  required
                />
                <datalist id="medications-list">
                  {medications.map((medication) => (
                    <option
                      key={medication.medication_id}
                      value={medication.name}
                    />
                  ))}
                </datalist>
              </div>
              <button
                type="button"
                className="btn-soft"
                style={{ padding: "12px", whiteSpace: "nowrap" }}
                onClick={() => setShowRequestMedication(!showRequestMedication)}
              >
                {showRequestMedication
                  ? "Cancel Request"
                  : "Not Found? Request"}
              </button>
            </div>

            {showRequestMedication && (
              <div
                style={{
                  background: "rgba(2, 132, 199, 0.05)",
                  padding: 16,
                  borderRadius: 12,
                  border: "1px dashed rgba(2, 132, 199, 0.3)",
                  marginBottom: 16,
                }}
              >
                <h4 style={{ margin: "0 0 12px 0", color: "var(--text)" }}>
                  Request New Medication
                </h4>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  <input
                    value={requestMedForm.name}
                    onChange={(e) =>
                      setRequestMedForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Medication Name"
                    required
                  />
                  <input
                    value={requestMedForm.type}
                    onChange={(e) =>
                      setRequestMedForm((prev) => ({
                        ...prev,
                        type: e.target.value,
                      }))
                    }
                    placeholder="Type (e.g. Tablet, Syrup)"
                  />
                  <textarea
                    rows="2"
                    value={requestMedForm.description}
                    onChange={(e) =>
                      setRequestMedForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Description/Reason for request"
                  />
                  <button
                    type="button"
                    onClick={requestNewMedication}
                    className="btn-main small"
                    style={{ width: "fit-content" }}
                  >
                    Submit Request
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: "grid", gap: 10 }}>
              <strong>Dosage by timing</strong>
              <div className="form-columns">
                {DOSE_PERIODS.map((period) => (
                  <label key={period.key}>
                    {period.label}
                    <input
                      value={medForm.dosage_schedule[period.key]}
                      onChange={(event) =>
                        setMedForm((current) => ({
                          ...current,
                          dosage_schedule: {
                            ...current.dosage_schedule,
                            [period.key]: event.target.value,
                          },
                        }))
                      }
                      placeholder={`Dose for ${period.label.toLowerCase()}`}
                    />
                  </label>
                ))}
              </div>
            </div>
            <div className="form-columns">
              <input
                type="date"
                value={medForm.start_date}
                onChange={(event) =>
                  setMedForm((current) => ({
                    ...current,
                    start_date: event.target.value,
                  }))
                }
              />
              <input
                type="date"
                min={medForm.start_date || ""}
                value={medForm.end_date}
                onChange={(event) =>
                  setMedForm((current) => ({
                    ...current,
                    end_date: event.target.value,
                  }))
                }
              />
            </div>
            <button type="submit" className="btn-soft">
              Add Medication + Log
            </button>
          </form>
        </div>
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <div className="section-heading">
          <h3>
            Prescription History{" "}
            {selectedPatientInfo ? `for ${selectedPatientInfo.full_name}` : ""}
          </h3>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : prescriptions.length ? (
          <div className="list-stack">
            {prescriptions.map((prescription) => (
              <div className="list-item" key={prescription.prescription_id}>
                <strong>{prescription.diagnosis}</strong>
                <span>
                  {new Date(prescription.prescribed_at).toLocaleString()}
                </span>
                <p>{prescription.diagnosis_notes || "No notes"}</p>
                <p className="muted">
                  Follow-up:{" "}
                  {formatPrescriptionDate(prescription.follow_up_date)}
                </p>
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
                  <span>{formatDoseSchedule(item)}</span>
                  <p className="muted">
                    {item.start_date || ""}{" "}
                    {item.end_date ? `→ ${item.end_date}` : ""}
                  </p>
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
