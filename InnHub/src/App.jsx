 import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Clientes from "./pages/Clientes";
import Empleados from "./pages/Empleados";
import Habitaciones from "./pages/Habitaciones";
import HabitacionCamas from "./pages/HabitacionCamas";
import HabitacionCaracteristicas from "./pages/HabitacionCaracteristicas";
import HabitacionImagenes from "./pages/HabitacionImagenes";
import Deshabilitados from "./pages/Deshabilitados";
import Dashboard from "./pages/Dashboard";
import Reservas from "./pages/Reservas";
import DashboardLayout from "./layouts/DashboardLayout";
import UsuarioAutenticadoRoute from "./components/UsuarioAutenticadoRoute";

function App() {
 return (   
 <BrowserRouter>
 <Routes>
 <Route path="/" element={<Home />} />
 <Route path="/login" element={<Login />} />
 <Route
 path="/dashboard"
 element={
 <UsuarioAutenticadoRoute>
 <DashboardLayout>
 <Dashboard />
 </DashboardLayout>
 </UsuarioAutenticadoRoute>
 }
 />
 <Route
 path="/Clientes"
 element={
 <UsuarioAutenticadoRoute>
 <DashboardLayout>
 <Clientes />
 </DashboardLayout>
 </UsuarioAutenticadoRoute>
 }
 />

 <Route
 path="/Empleados"
 element={
 <UsuarioAutenticadoRoute>
 <DashboardLayout>
 <Empleados />
 </DashboardLayout>
 </UsuarioAutenticadoRoute>
 }
 />

 <Route
 path="/Habitaciones"
 element={
 <UsuarioAutenticadoRoute>
 <DashboardLayout>
 <Habitaciones />
 </DashboardLayout>
 </UsuarioAutenticadoRoute>
 }
 />
 <Route
 path="/reservas"
 element={
 <UsuarioAutenticadoRoute>
 <DashboardLayout>
 <Reservas />
 </DashboardLayout>
 </UsuarioAutenticadoRoute>
 }
 />
 <Route
 path="/Deshabilitados"
 element={
 <UsuarioAutenticadoRoute>
 <DashboardLayout>
 <Deshabilitados />
 </DashboardLayout>
 </UsuarioAutenticadoRoute>
 }
 />
 <Route
 path="/HabitacionCamas"
 element={
 <UsuarioAutenticadoRoute>
 <DashboardLayout>
 <HabitacionCamas />
 </DashboardLayout>
 </UsuarioAutenticadoRoute>
 }
 />
 <Route
 path="/HabitacionCaracteristicas"
 element={
 <UsuarioAutenticadoRoute>
 <DashboardLayout>
 <HabitacionCaracteristicas />
 </DashboardLayout>
 </UsuarioAutenticadoRoute>
 }
 />
 <Route
 path="/HabitacionImagenes"
 element={
 <UsuarioAutenticadoRoute>
 <DashboardLayout>
 <HabitacionImagenes />
 </DashboardLayout>
 </UsuarioAutenticadoRoute>
 }
 />
 <Route path="*" element={<Navigate replace to="/" />} />
 </Routes>
 </BrowserRouter>
 );
 }

 export default App;
