import { useEffect, useState } from "react";
import { userApi } from "../../utils/apiHelper";
import { normalizeSpecializations } from "../../utils/specializations";

import { useNavigate } from "react-router-dom";

const Specializations = () => {
  const [specializations, setSpecializations] = useState([]);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSpecializations = async () => {
      try {
        const response = await userApi.getAllSpecializations();
        setSpecializations(normalizeSpecializations(response.data));
      } catch (err) {
        console.error(err);
        setSpecializations(normalizeSpecializations([]));
      }
    };
    fetchSpecializations();
  }, []);

  const visibleSpecializations = specializations.filter((spec) => {
    const text = `${spec.name} ${spec.description}`.toLowerCase();
    return text.includes(query.trim().toLowerCase());
  });

  return (
    <div className="page-shell">
      <section className="hero-panel">
        <div>
          <h1 className="eyebrow">Expertise</h1>
          <h2>Medical Specializations</h2>
          <p className="muted">
            Find the right specialist for your specific health needs from our network of verified professionals.
          </p>
        </div>
        <label style={{ display: "grid", gap: 8, alignSelf: "end" }}>
          Search specializations
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or care area"
            style={{ minHeight: 48 }}
          />
        </label>
      </section>

      <div className="grid-layout" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
        {visibleSpecializations.map((spec) => (
          <div 
            key={spec.name} 
            className="panel list-item" 
            onClick={() => navigate(`/specializations/${encodeURIComponent(spec.name)}`)}
            style={{ 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center", 
              textAlign: "center",
              padding: 32,
              cursor: "pointer",
              transition: "transform 0.2s ease"
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
          >
            <h3 style={{ fontSize: "1.5rem", marginBottom: 12 }}>{spec.name}</h3>
            <p className="muted" style={{ fontSize: "1rem", lineHeight: 1.5, marginBottom: 20 }}>{spec.description}</p>
            <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 8 }}>
              <span className="status-pill status-open" style={{ background: "rgba(0, 86, 179, 0.1)", color: "var(--accent)" }}>
                {spec.doctor_count || 0} Doctors Available
              </span>
            </div>
          </div>
        ))}
        {visibleSpecializations.length === 0 && (
          <div className="panel">
            <p className="muted">No specializations matched your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Specializations;
