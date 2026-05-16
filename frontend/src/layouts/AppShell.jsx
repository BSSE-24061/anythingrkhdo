import Navbar from "../components/Navbar";

const AppShell = ({ children }) => (
  <div className="app-shell">
    <Navbar />
    <main className="page-shell">{children}</main>
  </div>
);

export default AppShell;
