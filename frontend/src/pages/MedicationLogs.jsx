import { useEffect, useState } from "react";
import { medicationApi, getErrorMessage } from "../utils/apiHelper";
import { getStoredUser } from "../utils/session";

const MedicationLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const user = getStoredUser();

    useEffect(() => {
        const bootstrap = async () => {
            try {
                const response = await medicationApi.getLogsByPatient(user.id);
                setLogs(Array.isArray(response.data) ? response.data : []);
            } catch (err) {
                setError(getErrorMessage(err, "Failed to load medication logs"));
            } finally {
                setLoading(false);
            }
        };
        bootstrap();
    }, [user.id]);

    const loadLogs = async () => {
        const response = await medicationApi.getLogsByPatient(user.id);
        setLogs(Array.isArray(response.data) ? response.data : []);
    };

    const updateStatus = async (logId, status) => {
        try {
            await medicationApi.updateLogStatus(logId, status);
            await loadLogs();
        } catch (err) {
            alert(getErrorMessage(err, "Failed to update status"));
        }
    };

    if (loading) return <div className="content-page"><p>Loading...</p></div>;
    if (error) return <div className="content-page"><p className="error-text">{error}</p></div>;

    return (
        <div className="content-page">
            <section className="panel">
                <h2>Medication Logs</h2>
                <p className="muted">Track your medication intake</p>
                {logs.length === 0 ? (
                    <p className="muted">No medication logs available</p>
                ) : (
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Medication</th>
                                    <th>Dosage</th>
                                    <th>Scheduled Time</th>
                                    <th>Taken At</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.log_id}>
                                        <td>{log.medication_name || "Unknown"}</td>
                                        <td>{log.dosage}</td>
                                        <td>
                                            {log.scheduled_time
                                                ? new Date(log.scheduled_time).toLocaleString()
                                                : "—"}
                                        </td>
                                        <td>{log.taken_at ? new Date(log.taken_at).toLocaleString() : "-"}</td>
                                        <td>
                                            <span style={{
                                                color: log.status === 'taken' ? 'var(--accent)' :
                                                    log.status === 'missed' ? 'var(--danger)' : 'var(--muted)'
                                            }}>
                                                {log.status}
                                            </span>
                                        </td>
                                        <td>
                                            {log.status === 'pending' && (
                                                <>
                                                    <button
                                                        type="button"
                                                        className="btn-main small"
                                                        onClick={() => updateStatus(log.log_id, 'taken')}
                                                        style={{ marginRight: '8px' }}
                                                    >
                                                        Taken
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn-ghost small"
                                                        onClick={() => updateStatus(log.log_id, 'missed')}
                                                    >
                                                        Missed
                                                    </button>
                                                </>
                                            )}
                                        </td>
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

export default MedicationLogs;