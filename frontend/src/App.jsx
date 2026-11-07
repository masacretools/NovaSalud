import { useEffect, useState } from 'react'

import { cerrarSesion, guardarSesion, leerSesion, pedir } from './api'
import Icono from './componentes/Icono'
import Login from './paginas/Login'
import Dashboard from './paginas/Dashboard'
import Inventario from './paginas/Inventario'
import Ventas from './paginas/Ventas'
import Clientes from './paginas/Clientes'
import Alertas from './paginas/Alertas'

const MENU = [
  { clave: 'dashboard', titulo: 'Dashboard', icono: 'dashboard' },
  { clave: 'inventario', titulo: 'Inventario', icono: 'inventario' },
  { clave: 'ventas', titulo: 'Ventas', icono: 'ventas' },
  { clave: 'clientes', titulo: 'Clientes', icono: 'clientes' },
  { clave: 'alertas', titulo: 'Alertas', icono: 'alertas' },
]

const TITULOS = {
  dashboard: ['Dashboard', 'Resumen general de la botica'],
  inventario: ['Inventario', 'Productos, precios y existencias'],
  ventas: ['Ventas', 'Registro de ventas e historial'],
  clientes: ['Clientes', 'Datos de contacto y documentos'],
  alertas: ['Alertas', 'Stock bajo, agotados y vencimientos'],
}

export default function App() {
  const [sesion, setSesion] = useState(() => leerSesion())
  const [seccion, setSeccion] = useState('dashboard')
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [notificaciones, setNotificaciones] = useState([])
  const [validando, setValidando] = useState(Boolean(leerSesion()?.token))

  function notificar(mensaje, tipo = 'exito') {
    const id = `${Date.now()}-${Math.random()}`
    setNotificaciones((actuales) => [...actuales, { id, mensaje, tipo }])
    setTimeout(() => {
      setNotificaciones((actuales) => actuales.filter((item) => item.id !== id))
    }, 3800)
  }

  useEffect(() => {
    function alExpirar() {
      setSesion(null)
      notificar('Tu sesión expiró. Vuelve a iniciar sesión.', 'error')
    }

    window.addEventListener('nova:sesion-expirada', alExpirar)
    return () => window.removeEventListener('nova:sesion-expirada', alExpirar)
  }, [])

  useEffect(() => {
    if (!sesion?.token) {
      return
    }

    pedir('/auth/perfil')
      .then((datos) => {
        setSesion((actual) => ({ ...actual, usuario: datos.usuario }))
        guardarSesion(sesion.token, datos.usuario)
      })
      .catch(() => {
        cerrarSesion()
        setSesion(null)
      })
      .finally(() => setValidando(false))
    // Solo se valida al cargar la aplicación.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function alIngresar(datos) {
    guardarSesion(datos.token, datos.usuario)
    setSesion(datos)
    setSeccion('dashboard')
    notificar(`Bienvenido, ${datos.usuario.nombre}`)
  }

  function salir() {
    cerrarSesion()
    setSesion(null)
  }

  function navegar(destino) {
    setSeccion(destino)
    setMenuAbierto(false)
  }

  if (validando) {
    return (
      <div className="pantalla-carga">
        <div className="avatar">NS</div>
        <p>Comprobando sesión...</p>
      </div>
    )
  }

  if (!sesion?.token) {
    return (
      <>
        <Login alIngresar={alIngresar} notificar={notificar} />
        {notificaciones.length > 0 && (
          <div className="notificaciones">
            {notificaciones.map((item) => (
              <div key={item.id} className={`notificacion ${item.tipo}`}>
                {item.mensaje}
              </div>
            ))}
          </div>
        )}
      </>
    )
  }

  const [titulo, subtitulo] = TITULOS[seccion]
  const usuario = sesion.usuario || {}
  const iniciales = `${usuario.nombre?.[0] || 'N'}${usuario.apellido?.[0] || 'S'}`

  return (
    <div className="app">
      <aside className={`barra-lateral ${menuAbierto ? 'abierta' : ''}`}>
        <div className="marca">
          <div className="cruz">+</div>
          <div>
            <strong>Nova Salud</strong>
            <small>Gestión de botica</small>
          </div>
        </div>

        <nav className="menu">
          <span className="menu-titulo">Administración</span>
          {MENU.map((item) => (
            <button
              key={item.clave}
              type="button"
              className={seccion === item.clave ? 'activo' : ''}
              onClick={() => navegar(item.clave)}
            >
              <Icono nombre={item.icono} />
              {item.titulo}
            </button>
          ))}
        </nav>

        <div className="pie">
          <div className="usuario">
            <div className="avatar">{iniciales.toUpperCase()}</div>
            <div>
              <strong>
                {usuario.nombre} {usuario.apellido}
              </strong>
              <span>{usuario.rol}</span>
            </div>
          </div>
          <button type="button" className="boton-salir" onClick={salir}>
            <Icono nombre="salir" tamano={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="contenido">
        <header className="barra-superior">
          <button
            type="button"
            className="boton-menu"
            onClick={() => setMenuAbierto((valor) => !valor)}
            aria-label="Abrir menú"
          >
            <Icono nombre="menu" />
          </button>
          <div>
            <h1>{titulo}</h1>
            <p>{subtitulo}</p>
          </div>
          <div className="acciones">
            <button
              type="button"
              className="boton verde"
              onClick={() => navegar('ventas')}
            >
              <Icono nombre="mas" tamano={18} />
              Nueva venta
            </button>
          </div>
        </header>

        <main className="contenido-principal">
          {seccion === 'dashboard' && (
            <Dashboard irA={navegar} notificar={notificar} />
          )}
          {seccion === 'inventario' && (
            <Inventario notificar={notificar} />
          )}
          {seccion === 'ventas' && <Ventas notificar={notificar} />}
          {seccion === 'clientes' && <Clientes notificar={notificar} />}
          {seccion === 'alertas' && <Alertas irA={navegar} />}
        </main>
      </div>

      {notificaciones.length > 0 && (
        <div className="notificaciones">
          {notificaciones.map((item) => (
            <div key={item.id} className={`notificacion ${item.tipo}`}>
              {item.mensaje}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
