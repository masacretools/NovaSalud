const CLAVE_TOKEN = 'nova_salud_token'
const CLAVE_USUARIO = 'nova_salud_usuario'

// En local se usa el proxy /api de Vite. En producción se define VITE_API_URL
// con la URL completa del backend desplegado, por ejemplo:
// https://nova-salud-api.vercel.app/api
const BASE_API = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')

export function leerSesion() {
  try {
    const token = localStorage.getItem(CLAVE_TOKEN)
    const usuario = JSON.parse(localStorage.getItem(CLAVE_USUARIO) || 'null')
    return token ? { token, usuario } : null
  } catch {
    return null
  }
}

export function guardarSesion(token, usuario) {
  localStorage.setItem(CLAVE_TOKEN, token)
  localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario))
}

export function cerrarSesion() {
  localStorage.removeItem(CLAVE_TOKEN)
  localStorage.removeItem(CLAVE_USUARIO)
}

export async function pedir(ruta, opciones = {}) {
  const token = localStorage.getItem(CLAVE_TOKEN)
  const cabeceras = {
    'Content-Type': 'application/json',
    ...(opciones.headers || {}),
  }

  if (token) {
    cabeceras.Authorization = `Bearer ${token}`
  }

  const respuesta = await fetch(`${BASE_API}${ruta}`, {
    ...opciones,
    headers: cabeceras,
  })
  let datos

  try {
    datos = await respuesta.json()
  } catch {
    datos = {}
  }

  if (!respuesta.ok) {
    if (respuesta.status === 401 && token) {
      cerrarSesion()
      window.dispatchEvent(new Event('nova:sesion-expirada'))
    }
    throw new Error(datos.mensaje || 'No se pudo completar la operación')
  }

  return datos
}

export function formatearMoneda(valor) {
  return `S/ ${Number(valor || 0).toFixed(2)}`
}

export function formatearFecha(valor) {
  if (!valor) return '—'
  return new Date(valor).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatearFechaHora(valor) {
  if (!valor) return '—'
  return new Date(valor).toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
