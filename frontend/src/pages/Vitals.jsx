import { useEffect, useState } from "react";
import { vitalApi, getErrorMessage } from "../utils/apiHelper";
import { getStoredUser } from "../utils/session";

const Vitals = () => {
    const [vitals, setVitals] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        blood_pressure_systolic: "",
        blood_pressure_diastolic: "",
        heart_rate: "",
        glucose_level: "",
        oxygen_saturation: "",
        temperature: "",
        weight: "",
    });
    const user = getStoredUser();

    useEffect(() => {
        const loadVitals = async () => {
            try {
                const [vitalsResponse, alertsResponse] = await Promise.all([
                    vitalApi.getByPatient(user.id),
                    vitalApi.getAlerts(user.id),
                ]);
                setVitals(vitalsResponse.data);
                setAlerts(alertsResponse.data);
            } catch (err) {
                setError(getErrorMessage(err, "Failed to load vitals"));
            } finally {
                setLoading(false);
            }
        };
        loadVitals();
    }, [user.id]);

    const toNullableNumber = (value) => {
        if (value === "" || value === null || value === undefined) return null;
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                patient_user_id: user.id,
                blood_pressure_systolic: toNullableNumber(formData.blood_pressure_systolic),
                blood_pressure_diastolic: toNullableNumber(formData.blood_pressure_diastolic),
                heart_rate: toNullableNumber(formData.heart_rate),
                glucose_level: toNullableNumber(formData.glucose_level),
                oxygen_saturation: toNullableNumber(formData.oxygen_saturation),
                temperature: toNullableNumber(formData.temperature),
                weight: toNullableNumber(formData.weight),
            };

            await vitalApi.add(payload);
            setFormData({
                blood_pressure_systolic: "",
                blood_pressure_diastolic: "",
                heart_rate: "",
                glucose_level: "",
                oxygen_saturation: "",
                temperature: "",
                weight: "",
            });
            // Reload vitals
            const response = await vitalApi.getByPatient(user.id);
            setVitals(response.data);
            alert("Vitals added successfully!");
        } catch (err) {
            alert(getErrorMessage(err, "Failed to add vitals"));
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    if (loading) return <div className="content-page"><p>Loading...</p></div>;
    if (error) return <div className="content-page"><p className="error-text">{error}</p></div>;

    return (
        <div className="content-page">
            <section className="panel">
                <p className="eyebrow">Self monitoring</p>
                <h2>Add vitals</h2>
                <p className="muted">
                  Log blood pressure, glucose, cardio metrics, or general wellness numbers — alerts fire automatically when values look risky.
                </p>
                <form onSubmit={handleSubmit} className="form-grid">
                    <div>
                        <label>Blood Pressure (Systolic)</label>
                        <input
                            type="number"
                            name="blood_pressure_systolic"
                            value={formData.blood_pressure_systolic}
                            onChange={handleChange}
                            placeholder="120"
                        />
                    </div>
                    <div>
                        <label>Blood Pressure (Diastolic)</label>
                        <input
                            type="number"
                            name="blood_pressure_diastolic"
                            value={formData.blood_pressure_diastolic}
                            onChange={handleChange}
                            placeholder="80"
                        />
                    </div>
                    <div>
                        <label>Heart Rate (BPM)</label>
                        <input
                            type="number"
                            name="heart_rate"
                            value={formData.heart_rate}
                            onChange={handleChange}
                            placeholder="72"
                        />
                    </div>
                    <div>
                        <label>Glucose Level (mg/dL)</label>
                        <input
                            type="number"
                            step="0.1"
                            name="glucose_level"
                            value={formData.glucose_level}
                            onChange={handleChange}
                            placeholder="90"
                        />
                    </div>
                    <div>
                        <label>Oxygen Saturation (%)</label>
                        <input
                            type="number"
                            step="0.1"
                            name="oxygen_saturation"
                            value={formData.oxygen_saturation}
                            onChange={handleChange}
                            placeholder="98"
                        />
                    </div>
                    <div>
                        <label>Temperature (°C)</label>
                        <input
                            type="number"
                            step="0.1"
                            name="temperature"
                            value={formData.temperature}
                            onChange={handleChange}
                            placeholder="36.5"
                        />
                    </div>
                    <div>
                        <label>Weight (kg)</label>
                        <input
                            type="number"
                            step="0.1"
                            name="weight"
                            value={formData.weight}
                            onChange={handleChange}
                            placeholder="70"
                        />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                        <button type="submit" className="btn-main">Add Vitals</button>
                    </div>
                </form>
            </section>

            {alerts.length > 0 && (
                <section className="panel">
                    <h3>Health Alerts</h3>
                    <div className="list-stack">
                        {alerts.map((alert) => (
                            <div key={alert.alert_id} className="list-item" style={{ borderLeft: '4px solid var(--danger)' }}>
                                <h4>{alert.alert_type}</h4>
                                <p>{alert.message}</p>
                                <span className="muted">{new Date(alert.triggered_at).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <section className="panel">
                <h3>Vitals History</h3>
                {vitals.length === 0 ? (
                    <p className="muted">No vitals recorded yet</p>
                ) : (
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Blood Pressure</th>
                                    <th>Heart Rate</th>
                                    <th>Glucose</th>
                                    <th>Temperature</th>
                                    <th>Weight</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vitals.map((vital) => (
                                    <tr key={vital.vital_id}>
                                        <td>{new Date(vital.logged_at).toLocaleDateString()}</td>
                                        <td>
                                          {vital.blood_pressure_systolic != null &&
                                          vital.blood_pressure_diastolic != null
                                            ? `${vital.blood_pressure_systolic}/${vital.blood_pressure_diastolic}`
                                            : "—"}
                                        </td>
                                        <td>{vital.heart_rate != null ? `${vital.heart_rate} BPM` : "—"}</td>
                                        <td>
                                          {vital.glucose_level != null
                                            ? `${vital.glucose_level} mg/dL`
                                            : "—"}
                                        </td>
                                        <td>
                                          {vital.temperature != null ? `${vital.temperature}°C` : "—"}
                                        </td>
                                        <td>{vital.weight != null ? `${vital.weight} kg` : "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
};

export default Vitals;