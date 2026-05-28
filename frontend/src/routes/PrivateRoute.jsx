import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <p>Cargando...</p>;

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
}

export default PrivateRoute;navigation