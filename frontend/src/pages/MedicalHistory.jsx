import { useEffect, useState } from "react";
import { historyApi } from "../utils/apiHelper";
import { getStoredUser } from "../utils/session";

const MedicalHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const user = getStoredUser();

    useEffect(() => {
        const loadHistory = async () => {
            try {
                const response = await historyApi.getByPatient(user.id);
                setHistory(response.data);
            } catch {
                setError("Failed to load medical history");
            } finally {
                setLoading(false);
            }
        };
        loadHistory();
    }, [user.id]);

    if (loading) return <div className="content-page"><p>Loading...</p></div>;
    if (error) return <div className="content-page"><p className="error-text">{error}</p></div>;

    return (
        <div className="content-page">
            <section className="panel">
                <h2>Medical History</h2>
                <p className="muted">Your complete medical timeline</p>
                {history.length === 0 ? (
                    <p className="muted">No medical history available</p>
                ) : (
                    <div className="list-stack">
                        {history.map((item) => (
                            <div key={item.history_id} className="list-item">
                                <h4>{item.title}</h4>
                                <p>{item.description}</p>
                                <div className="stacked-note">
                                    <div>
                                        <strong>Type:</strong> {item.event_type}
                                    </div>
                                    <div>
                                        <strong>Date:</strong> {new Date(item.event_date).toLocaleDateString()}
                                    </div>
                                    <div>
                                        <strong>Added:</strong> {new Date(item.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default MedicalHistory;