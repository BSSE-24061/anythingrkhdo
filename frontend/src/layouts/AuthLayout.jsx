const AuthLayout = ({
  heroTitle,
  heroText,
  heroTone = "default",
  children,
}) => (
  <div
    className={`auth-layout ${heroTone === "signup" ? "auth-page-signup" : ""}`.trim()}
  >
    <section className="auth-hero">
      <p className="eyebrow">CARE PLATFORM</p>
      <h1>{heroTitle}</h1>
      <p>{heroText}</p>
    </section>

    {children}
  </div>
);

export default AuthLayout;
