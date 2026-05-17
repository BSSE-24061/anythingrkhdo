import { Navigate, useLocation } from "react-router-dom";
import { getStoredUser, isAuthenticated } from "../utils/session";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const location = useLocation();
  const user = getStoredUser();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    if (!user || !allowedRoles.includes(user.role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
