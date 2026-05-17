import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { userApi } from "../utils/apiHelper";

const Specializations = () => {
    const [specializations, setSpecializations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadSpecializations = async () => {
            try {
                const response = await userApi.getAllSpecializations();
                setSpecializations(response.data);
            } catch {
                setError("Failed to load specializations");
            } finally {
                setLoading(false);
            }
        };
        loadSpecializations();
    }, []);

    if (loading) return <div className="content-page"><p>Loading...</p></div>;
    if (error) return <div className="content-page"><p className="error-text">{error}</p></div>;

    return (
        <div className="content-page">
            <section className="panel">
                <h2>Medical Specializations</h2>
                <p className="muted">Select a specialization to view available doctors</p>
                <div className="feature-list">
                    {specializations.map((spec) => (
                        <Link key={spec} to={`/specializations/${encodeURIComponent(spec)}`} className="spec-link">
                            {spec}
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default Specializations;