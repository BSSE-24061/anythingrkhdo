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

  // Get all (pending, confirmed) appointments for the selected patient - exclude completed and cancelled
  const availableAppointments = useMemo(() => {
    return appointments.filter(
      (apt) =>
        apt.patient_user_id === selectedPatient && 
        apt.status !== "completed" && 
        apt.status !== "cancelled",
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
    
