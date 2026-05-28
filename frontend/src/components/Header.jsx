import { useAuth } from "../auth/AuthContext";

function Header() {
  const { user, logout } = useAuth();

  return (
    <div
      style={{
        height: "60px",
        background: "#f1f5f9",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        borderBottom: "1px solid #ccc",
      }}
    >
      <h3>Dashboard</h3>

      <div>
        <span style={{ marginRight: "10px" }}>
          {user?.username}
        </span>
        <button onClick={logout}>Cerrar sesión</button>
      </div>
    </div>
  );
}

export default Header;