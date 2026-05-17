import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { getStoredUser, setSession } from "./utils/session";
import ProtectedRoute from "./components/ProtectedRoute";
import Appointments from "./pages/patient/Appointments";
import Chat from "./pages/patient/Chat";
import Community from "./pages/patient/Community";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import GoogleOnboarding from "./pages/auth/GoogleOnboarding";
// doctor module
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import DoctorAppointments from "./pages/doctor/Appointments";
import DoctorVitals from "./pages/doctor/Vitals";
import DoctorPatients from "./pages/doctor/Patients";
import DoctorPrescriptions from "./pages/doctor/Prescriptions";
import DoctorAvailability from "./pages/doctor/Availability";
import DoctorChat from "./pages/doctor/Chat";
import DoctorMedicationLogs from "./pages/doctor/MedicationLogs";
import DoctorHistory from "./pages/doctor/MedicalHistory";
import DoctorBlogs from "./pages/doctor/Blogs";
import DoctorForum from "./pages/doctor/Forum";
// patient module
import PatientDashboard from "./pages/patient/Dashboard";
// admin module
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminBlogApproval from "./pages/admin/BlogApproval";
import AdminCommentModeration from "./pages/admin/CommentModeration";
import AdminCreateBlog from "./pages/admin/CreateBlog";
// consultant module
import ConsultantDashboard from "./pages/consultant/ConsultantDashboard";
import PatientLayout from "./layouts/PatientLayout";
import DoctorRouteLayout from "./layouts/DoctorRouteLayout";
import Specializations from "./pages/patient/Specializations";
import DoctorsBySpecialization from "./pages/doctor/DoctorsBySpecialization";
import Consultant from "./pages/patient/Consultant";
import MedicalHistory from "./pages/patient/MedicalHistory";
import Vitals from "./pages/patient/Vitals";
import MedicationLogs from "./pages/patient/MedicationLogs";
import Blogs from "./pages/patient/Blogs";
import BlogArticle from "./pages/patient/BlogArticle";
import Forum from "./pages/patient/Forum";
import Alerts from "./pages/patient/Alerts";

function App() {
  const [user, setUser] = useState(getStoredUser());
  const [checkingAuth, setCheckingAuth] = useState(false);

  useEffect(() => {
    // If we have a local user, we're good.
    // If not, check if we're logged in via Google (backend session)
    if (!user) {
      setCheckingAuth(true);
      // We call the backend directly (not through api helper with Bearer token)
      // because we rely on the browser cookie from the Passport redirect
      fetch("http://localhost:5000/auth/user", { credentials: "include" })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            // Note: the backend /auth/user might return a different structure
            // depending on if it's a first-time Google user or an existing one.
            // For now, let's just see if we can get a session.
            // If the user needs onboarding, the backend might handle that.
          }
        })
        .finally(() => setCheckingAuth(false));
    }
  }, []);

  const DashboardRedirect = () => {
    const currentUser = getStoredUser();
    if (!currentUser) return <Navigate to="/login" replace />;

    switch (currentUser.role?.toLowerCase()) {
      case "doctor":
        return <Navigate to="/doctor/dashboard" replace />;
      case "patient":
        return <Navigate to="/patient/dashboard" replace />;
      case "admin":
        return <Navigate to="/admin/dashboard" replace />;
      case "consultant":
        return <Navigate to="/consultant/dashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  };

  if (checkingAuth) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
        <p style={{ fontWeight: 800, color: "#64748b" }}>Verifying session...</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/login"
          element={getStoredUser() ? <DashboardRedirect /> : <Login />}
        />
        <Route
          path="/signup"
          element={getStoredUser() ? <DashboardRedirect /> : <Signup />}
        />
        <Route path="/google-onboarding" element={<GoogleOnboarding />} />

        <Route path="/dashboard" element={<DashboardRedirect />} />

        {/* Doctor routes with shared layout */}
        <Route
          path="/doctor"
          element={
            <ProtectedRoute allowedRoles={["doctor"]}>
              <DoctorRouteLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<DoctorDashboard />} />
          <Route path="appointments" element={<DoctorAppointments />} />
          <Route path="vitals" element={<DoctorVitals />} />
          <Route path="patients" element={<DoctorPatients />} />
          <Route path="prescriptions" element={<DoctorPrescriptions />} />
          <Route path="availability" element={<DoctorAvailability />} />
          <Route path="chat" element={<DoctorChat />} />
          <Route path="medication-logs" element={<DoctorMedicationLogs />} />
          <Route path="history" element={<DoctorHistory />} />
          <Route path="blogs" element={<DoctorBlogs />} />
          <Route path="forum" element={<DoctorForum />} />
          <Route path="" element={<Navigate to="dashboard" replace />} />
        </Route>

        <Route
          path="/patient/dashboard"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <PatientLayout>
                <PatientDashboard />
              </PatientLayout>
            </ProtectedRoute>
          }
        />

        {/* Admin Dashboard */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin Blog Approval */}
        <Route
          path="/admin/blog-approval"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminBlogApproval />
            </ProtectedRoute>
          }
        />

        {/* Admin Comment Moderation */}
        <Route
          path="/admin/comment-moderation"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminCommentModeration />
            </ProtectedRoute>
          }
        />

        {/* Admin Create Blog */}
        <Route
          path="/admin/create-blog"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminCreateBlog />
            </ProtectedRoute>
          }
        />

        {/* Consultant Dashboard */}
        <Route
          path="/consultant/dashboard"
          element={
            <ProtectedRoute allowedRoles={["consultant"]}>
              <ConsultantDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/appointments"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <PatientLayout>
                <Appointments />
              </PatientLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/specializations"
          element={
            <ProtectedRoute>
              <PatientLayout>
                <Specializations />
              </PatientLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/specializations/:specialization"
          element={
            <ProtectedRoute>
              <PatientLayout>
                <DoctorsBySpecialization />
              </PatientLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/consultant"
          element={
            <ProtectedRoute>
              <PatientLayout>
                <Consultant />
              </PatientLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <PatientLayout>
                <MedicalHistory />
              </PatientLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/vitals"
          element={
            <ProtectedRoute>
              <PatientLayout>
                <Vitals />
              </PatientLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/medications"
          element={
            <ProtectedRoute>
              <PatientLayout>
                <MedicationLogs />
              </PatientLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/alerts"
          element={
            <PatientLayout>
              <Alerts />
            </PatientLayout>
          }
        />

        <Route
          path="/blogs"
          element={
            <ProtectedRoute>
              <PatientLayout>
                <Blogs />
              </PatientLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/blogs/:articleId"
          element={
            <ProtectedRoute>
              <PatientLayout>
                <BlogArticle />
              </PatientLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/forum"
          element={
            <ProtectedRoute allowedRoles={["patient", "admin", "consultant"]}>
              <PatientLayout>
                <Forum user={user} />
              </PatientLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat"
          element={
            <ProtectedRoute allowedRoles={["patient", "consultant"]}>
              <PatientLayout>
                <Chat user={user} />
              </PatientLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/community"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <PatientLayout>
                <Community user={user} />
              </PatientLayout>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
