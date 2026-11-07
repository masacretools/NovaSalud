import { useState } from 'react'

import { pedir } from '../api'

export default function Login({ alIngresar }) {
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

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
            <p className="ayuda">Ingresa con tu cuenta de administrador.</p>
          </div>

          {error && <div className="alerta-error">{error}</div>}

          <div className="campo">
            <label htmlFor="correo">Correo electrónico</label>
            <input
              id="correo"
              type="email"
              value={correo}
              onChange={(evento) => setCorreo(evento.target.value)}
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
              onChange={(evento) => setPassword(evento.target.value)}
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
