function ConfirmModal({ isOpen, onClose, onConfirm, message }) {
  if (!isOpen) return null;

  const isDark = document.documentElement.classList.contains("dark");

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: isDark ? "#1f2937" : "#ffffff",
          color: isDark ? "#ffffff" : "#111827",
          padding: "24px",
          borderRadius: "12px",
          minWidth: "350px",
          maxWidth: "90%",
          textAlign: "center",
          boxShadow: "0 15px 35px rgba(0,0,0,0.25)",
          border: isDark
            ? "1px solid rgba(255,255,255,0.08)"
            : "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <h3
          style={{
            margin: 0,
            marginBottom: "20px",
            fontSize: "18px",
            fontWeight: "600",
          }}
        >
          {message || "¿Estás seguro?"}
        </h3>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "12px",
          }}
        >
          <button
            onClick={onConfirm}
            style={{
              background: "#dc2626",
              color: "#fff",
              border: "none",
              padding: "10px 18px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Sí, eliminar
          </button>

          <button
            onClick={onClose}
            style={{
              background: isDark ? "#374151" : "#e5e7eb",
              color: isDark ? "#ffffff" : "#111827",
              border: "none",
              padding: "10px 18px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;