 import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Clientes from "./pages/Clientes";
import Empleados from "./pages/Empleados";
import Habitaciones from "./pages/Habitaciones";
import Dashboard from "./pages/Dashboard";
import DashboardLayout from "./layouts/DashboardLayout";

function App() {
 return (
 <BrowserRouter>
 <Routes>
 <Route path="/" element={<Home />} />
 <Route path="/login" element={<Login />} />
 <Route
 path="/dashboard"
 element={
 <DashboardLayout>
 <Dashboard />
 </DashboardLayout>
 }
 />
 <Route
 path="/Clientes"
 element={
 <DashboardLayout>
 <Clientes />
 </DashboardLayout>
 }
 />

 <Route
 path="/Empleados"
 element={
 <DashboardLayout>
 <Empleados />
 </DashboardLayout>
 }
 />

 <Route
 path="/Habitaciones"
 element={
 <DashboardLayout>
 <Habitaciones />
 </DashboardLayout>
 }
 />
 <Route path="*" element={<Navigate replace to="/" />} />
 </Routes>
 </BrowserRouter>
 );
 }

 export default App;
