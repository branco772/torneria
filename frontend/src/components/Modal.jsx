function ConfirmModal({ isOpen, onClose, onConfirm, message }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{
        background: "white",
        padding: "20px",
        borderRadius: "10px",
        textAlign: "center",
        minWidth: "300px"
      }}>
        <h3>{message || "¿Estás seguro?"}</h3>

        <div style={{ marginTop: "20px" }}>
          <button onClick={onConfirm}>
            Sí, continuar
          </button>

          <button onClick={onClose} style={{ marginLeft: "10px" }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;