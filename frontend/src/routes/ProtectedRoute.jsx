import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, roles }) {
  const token = localStorage.getItem("token");
  const role  = localStorage.getItem("role");

  if (!token) return <Navigate to="/" />;

  if (roles && !roles.includes(role)) {
    alert("Your role is not sufficient for this task.");
    return <Navigate to="/dashboard" />;
  }

  return children;
}

export default ProtectedRoute;