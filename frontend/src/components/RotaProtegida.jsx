export default function RotaProtegida({ children, apenasAdmin = false }) {
  const token = localStorage.getItem("token");
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");

  if (!token || !usuario) {
    window.location.href = "/login";
    return null;
  }

  if (apenasAdmin && usuario.tipo !== "admin") {
    window.location.href = "/agendar";
    return null;
  }

  return children;
}