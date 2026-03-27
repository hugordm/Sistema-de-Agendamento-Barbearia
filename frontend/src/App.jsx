import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Admin from "./pages/Admin";
import Agendar from "./pages/Agendar";
import RotaProtegida from "./components/RotaProtegida";
import RecuperarSenha from "./pages/RecuperarSenha";
import NovaSenha from "./pages/NovaSenha";

const router = createBrowserRouter([
  { path: "/", element: <Login /> },
  { path: "/login", element: <Login /> },
  { path: "/cadastro", element: <Cadastro /> },
  { path: "/recuperar-senha", element: <RecuperarSenha /> },
  { path: "/nova-senha", element: <NovaSenha /> },
  {
    path: "/admin",
    element: (
      <RotaProtegida apenasAdmin>
        <Admin />
      </RotaProtegida>
    ),
  },
  {
    path: "/agendar",
    element: (
      <RotaProtegida>
        <Agendar />
      </RotaProtegida>
    ),
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}