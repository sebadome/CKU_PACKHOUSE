import React, { useState, useContext } from "react";
import Input from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Registro: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useContext(AuthContext);

  const [name, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [planta, setPlanta] = useState("");
  const [rut, setRut] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roles, setRol] = useState<"Trabajador CKU" | "Administrador">(
    "Trabajador CKU"
  );
  const [msg, setMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: name.trim(),
      apellido: apellido.trim(),
      planta: planta.trim(),
      rut: rut.trim(),
      email: email.trim().toLowerCase(),
      password: password.trim(),
      roles,
    };

    if (
      !payload.name ||
      !payload.apellido ||
      !payload.rut ||
      !payload.email ||
      !payload.password ||
      !payload.planta
    ) {
      setMsg("Todos los campos son obligatorios");
      return;
    }

    try {
      await register(payload); // ✅ USAMOS CONTEXTO
      setMsg("✅ Usuario creado correctamente");
      navigate("/", { replace: true });
    } catch (err: any) {
      setMsg(err.message || "Error al registrar");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={submit}
        className="bg-white p-6 rounded-lg shadow-md w-full max-w-md space-y-4"
      >
        <h2 className="text-xl font-semibold text-center">Registro</h2>

        <Input label="Nombre" value={name} onChange={e => setNombre(e.target.value)} />
        <Input label="Apellido" value={apellido} onChange={e => setApellido(e.target.value)} />
        <Input label="Rut" value={rut} maxLength={12} onChange={(e) => {const value = e.target.value.slice(0, 12);setRut(value);}} />
        <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
        <Input label="Contraseña" type="password" value={password} onChange={e => setPassword(e.target.value)} />

        <div>
          <label className="block text-sm font-medium mb-1">Planta</label>
          <select
            value={planta}
            onChange={e => setPlanta(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="">Seleccione planta</option>
            {["Linares","Teno","Romeral","Requinoa","Linderos","San Felipe","Coquimbo","Rancagua","Copiapo"]
              .map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Rol</label>
          <select
            value={roles}
            onChange={e => setRol(e.target.value as any)}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value=" Trabajador CKU"> Trabajador CKU</option>
            <option value="Administrador">Administrador</option>
          </select>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Registrando..." : "Registrar"}
        </Button>

        {msg && <p className="text-center text-sm mt-2">{msg}</p>}
      </form>
    </div>
  );
};

export default Registro;
