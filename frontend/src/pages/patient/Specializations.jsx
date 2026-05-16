import { useEffect, useState } from "react";
import { userApi } from "../../utils/apiHelper";

const SPECS = [
  { name: "Cardiology", icon: "❤️", desc: "Heart and vascular system health." },
  { name: "Dermatology", icon: "✨", desc: "Skin, hair, and nail conditions." },
  { name: "Neurology", icon: "🧠", desc: "Brain and nervous system disorders." },
  { name: "Pediatrics", icon: "👶", desc: "Medical care for infants and children." },
  { name: "Orthopedics", icon: "🦴", desc: "Bones, joints, and muscular system." },
  { name: "General Medicine", icon: "🩺", desc: "Primary care and general health." },
  { name: "Psychiatry", icon: "🧘", desc: "Mental health and behavioral wellness." },
  { name: "Gynecology", icon: "🚺", desc: "Women's reproductive health." },
];

const Specializations = () => {
  const [counts, setCounts] = useState({});

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const response = await userApi.list();
        const doctors = (response.data || []).filter(u => u.role === "doctor");
        const tally = {};
        doctors.forEach(doc => {
          if (doc.specialization) {
            tally[doc.specialization] = (tally[doc.specialization] || 0) + 1;
          }
        });
        setCounts(tally);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCounts();
  }, []);

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
      </section>

      <div className="grid-layout" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
        {SPECS.map((spec) => (
          <div 
            key={spec.name} 
            className="panel list-item" 
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
            <div style={{ fontSize: 48, marginBottom: 16 }}>{spec.icon}</div>
            <h3 style={{ fontSize: "1.5rem", marginBottom: 12 }}>{spec.name}</h3>
            <p className="muted" style={{ fontSize: "1rem", lineHeight: 1.5, marginBottom: 20 }}>{spec.desc}</p>
            <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 8 }}>
              <span className="status-pill status-open" style={{ background: "rgba(0, 86, 179, 0.1)", color: "var(--accent)" }}>
                {counts[spec.name] || 0} Doctors Available
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Specializations;