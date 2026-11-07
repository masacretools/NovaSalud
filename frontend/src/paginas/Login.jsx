import { useState } from 'react'

import { pedir } from '../api'

// Credenciales ficticias para facilitar la demostración académica.
// El script backend/database/datos_demostracion.js crea estas cuentas.
const CUENTAS_PRUEBA = [
  {
    id: 'admin',
    etiqueta: 'Administrador de prueba',
    correo: 'admin.demo@novasalud.test',
    password: 'Demo12345',
  },
  {
    id: 'empleado',
    etiqueta: 'Empleado de prueba',
    correo: 'empleado.demo@novasalud.test',
    password: 'Demo12345',
  },
]

export default function Login({ alIngresar }) {
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [cuentaPrueba, setCuentaPrueba] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  function seleccionarCuentaPrueba(evento) {
    const id = evento.target.value
    const cuenta = CUENTAS_PRUEBA.find((item) => item.id === id)

    setCuentaPrueba(id)
    setError('')

    if (cuenta) {
      setCorreo(cuenta.correo)
      setPassword(cuenta.password)
    }
  }

  async function enviar(evento) {
    evento.preventDefault()
    setError('')
    setCargando(true)

    try {
      const datos = await pedir('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ correo, password }),
      })
      alIngresar(datos)
    } catch (fallo) {
      setError(fallo.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="login-pantalla">
      <section className="login-marca">
        <div>
          <div className="login-logo">
            <span className="cruz">+</span>
            Nova Salud
          </div>
          <h1>Control total de tu botica, en un solo panel.</h1>
          <p>
            Gestiona inventario, ventas, clientes y alertas de stock desde una
            plataforma sencilla, rápida y segura.
          </p>
          <div className="login-puntos">
            <span>Inventario y precios actualizados</span>
            <span>Ventas con descuento automático de stock</span>
            <span>Alertas de stock bajo y próximos vencimientos</span>
          </div>
        </div>
        <p className="login-pie">Sistema web de gestión · Nova Salud</p>
      </section>

      <section className="login-formulario">
        <form className="login-caja" onSubmit={enviar}>
          <div>
            <h2>Iniciar sesión</h2>
            <p className="ayuda">Ingresa con tu cuenta para acceder al panel.</p>
          </div>

          {error && <div className="alerta-error">{error}</div>}

          <div className="login-prueba">
            <div className="login-prueba-cabecera">
              <strong>Acceso de prueba</strong>
              <span>Solo demostración</span>
            </div>
            <label htmlFor="cuenta-prueba">Selecciona una cuenta</label>
            <select
              id="cuenta-prueba"
              value={cuentaPrueba}
              onChange={seleccionarCuentaPrueba}
              disabled={cargando}
            >
              <option value="">Selecciona una cuenta de prueba...</option>
              {CUENTAS_PRUEBA.map((cuenta) => (
                <option key={cuenta.id} value={cuenta.id}>
                  {cuenta.etiqueta}
                </option>
              ))}
            </select>
            <p>
              Al elegir una cuenta se completan las credenciales. Estas cuentas
              se crean con <code>npm run db:demo</code>.
            </p>
          </div>

          <div className="campo">
            <label htmlFor="correo">Correo electrónico</label>
            <input
              id="correo"
              type="email"
              value={correo}
              onChange={(evento) => {
                setCorreo(evento.target.value)
                setCuentaPrueba('')
              }}
              placeholder="admin@novasalud.test"
              autoComplete="username"
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(evento) => {
                setPassword(evento.target.value)
                setCuentaPrueba('')
              }}
              placeholder="Tu contraseña"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="boton primario"
            disabled={cargando}
          >
            {cargando ? 'Ingresando...' : 'Ingresar al panel'}
          </button>

          <p className="nota">
            Si es la primera vez que ejecutas el proyecto, crea el administrador
            con <code>npm run db:admin</code> dentro de la carpeta backend.
          </p>
        </form>
      </section>
    </div>
  )
}
