import { Navigate } from "react-router-dom";

/** Legacy route — full HR verification lives on the dashboard. */
const HrViewProfile = () => <Navigate to="/hr-dashboard" replace />;

export default HrViewProfile;
