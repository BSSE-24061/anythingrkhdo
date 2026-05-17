const AuthLayout = ({
  heroTitle,
  heroText,
  heroTone = "default",
  children,
}) => (
  <div
    style={{
      minHeight: "100vh",
      background: "#f8fafc",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      fontFamily: "inherit",
    }}
  >
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 32,
        maxWidth: heroTone === "signup" ? 600 : 440,
        width: "100%",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 48,
            height: 48,
            borderRadius: 14,
            background: "#2563eb",
            color: "#fff",
            fontSize: 22,
            fontWeight: 900,
            boxShadow: "0 8px 20px rgba(37, 99, 235, 0.25)",
            marginBottom: 20,
          }}
        >
          ✓
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 28,
            color: "#0f172a",
            fontWeight: 900,
            letterSpacing: "-0.02em",
          }}
        >
          {heroTitle}
        </h1>
        <p
          style={{
            margin: "12px 0 0",
            color: "#64748b",
            fontSize: 15,
            fontWeight: 600,
            lineHeight: 1.5,
          }}
        >
          {heroText}
        </p>
      </div>

      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e6edf5",
          borderRadius: 20,
          padding: 32,
          boxShadow: "0 10px 40px -10px rgba(0,0,0,0.05)",
        }}
      >
        {children}
      </div>
    </div>
  </div>
);

export default AuthLayout;
