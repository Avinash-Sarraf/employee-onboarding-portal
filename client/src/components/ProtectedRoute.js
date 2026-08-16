import { Navigate, useLocation } from "react-router-dom";
import { getToken, getUser } from "../utils/auth";
import { getDashboardPath } from "./layout/navConfig";

/**
 * @param {object} props
 * @param {import('react').ReactNode} props.children
 * @param {('employee'|'hr')[]} [props.roles] — if set, user must have one of these roles
 */
const ProtectedRoute = ({ children, roles }) => {
  const location = useLocation();
  const token = getToken();
  const user = getUser();

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return children;
};

export default ProtectedRoute;
