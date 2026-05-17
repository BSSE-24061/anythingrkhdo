import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { userApi, chatApi, getErrorMessage } from "../utils/apiHelper";
import { getStoredUser } from "../utils/session";

const Consultant = () => {
    const navigate = useNavigate();
    const [consultant, setConsultant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const user = getStoredUser();

    useEffect(() => {
        const loadConsultant = async () => {
            try {
                setError("");
                const response = await userApi.getConsultant();
                const consultantData = Array.isArray(response.data) ? response.data[0] : response.data;
                setConsultant(consultantData || null);
            } catch (err) {
                try {
                    const response = await userApi.list();
                    const users = Array.isArray(response.data) ? response.data : [];
                    const consultantData = users.find((entry) => entry.role === "consultant");
                    setConsultant(consultantData || null);
                    setError("");
                } catch {
                    setError(getErrorMessage(err, "Failed to load consultant"));
                    setConsultant(null);
                }
            } finally {
                setLoading(false);
            }
        };
        loadConsultant();
    }, []);

    const startChat = async (consultantId) => {
        if (!user?.id) {
            setError("Please log in as a patient to start consultant chat");
            return;
        }

        try {
            await chatApi.findOrCreateRoom({
                patient_user_id: user.id,
                consultant_user_id: consultantId,
                room_type: "consultation",
            });
            navigate("/chat");
        } catch (err) {
            alert(getErrorMessage(err, "Failed to start chat"));
        }
    };

    if (loading) return <div className="content-page"><section className="panel"><p>Loading...</p></section></div>;

    return (
        <div className="content-page">
            <section className="panel">
                <p className="eyebrow">Patient support</p>
                <h2>Consultant Chat</h2>
                <p className="muted">
                    Start one consultation thread when you are unsure which specialist to visit.
                </p>
                {error && <p className="error-text">{error}</p>}
                {!error && !consultant ? (
                    <p className="muted">No consultant available</p>
                ) : (
                    consultant && (
                    <div className="consultant-chat-card">
                        <div>
                            <span className="status-pill status-open">Available</span>
                            <h3>{consultant.full_name}</h3>
                            <p className="muted">{consultant.email}</p>
                        </div>
                        <button
                            type="button"
                            className="btn-main"
                            onClick={() => startChat(consultant.user_id)}
                        >
                            Chat with Consultant
                        </button>
                    </div>
                    )
                )}
            </section>
        </div>
    );
};

export default Consultant;
