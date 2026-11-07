import { useEffect, useState } from 'react'

import { formatearFechaHora, formatearMoneda, pedir } from '../api'
import Icono from '../componentes/Icono'

function EtiquetaStock({ producto }) {
  if (producto.stock === 0) {
    return <span className="etiqueta-estado agotado">Agotado</span>
  }

  if (producto.stock <= producto.stockMinimo) {
    return <span className="etiqueta-estado bajo">Stock bajo</span>
  }

  return <span className="etiqueta-estado ok">Disponible</span>
}

export default function Dashboard({ irA }) {
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let activo = true

    pedir('/dashboard')
      .then((respuesta) => {
        if (activo) setDatos(respuesta)
      })
      .catch((fallo) => {
        if (activo) setError(fallo.message)
      })
      .finally(() => {
        if (activo) setCargando(false)
      })

    return () => {
      activo = false
    }
  }, [])

  if (cargando) {
    return <div className="cargando">Cargando resumen de la botica...</div>
  }

  if (error) {
    return <div className="alerta-error">{error}</div>
  }

  const totales = datos.totales
  const productosBajoStock = datos.productosBajoStock

  return (
    <>
      <section className="tarjetas">
        <article className="tarjeta destacada">
          <span className="etiqueta">Ingresos totales</span>
          <span className="valor">{formatearMoneda(totales.ingresos)}</span>
          <span className="detalle">
            Ticket promedio {formatearMoneda(totales.ticketPromedio)}
          </span>
        </article>

        <article className="tarjeta verde">
          <span className="etiqueta">Ventas de hoy</span>
          <span className="valor">{formatearMoneda(totales.ingresosDelDia)}</span>
          <span className="detalle">
            {totales.ventasDelDia} venta(s) registrada(s) hoy
          </span>
        </article>

        <article className="tarjeta">
          <span className="etiqueta">Productos activos</span>
          <span className="valor">{totales.productos}</span>
          <span className="detalle">En catálogo de inventario</span>
        </article>

        <article className="tarjeta">
          <span className="etiqueta">Ventas registradas</span>
          <span className="valor">{totales.ventas}</span>
          <span className="detalle">Historial completo de ventas</span>
        </article>

        <article className="tarjeta">
          <span className="etiqueta">Stock bajo</span>
          <span className="valor">{totales.stockBajo}</span>
          <span className="detalle">Igual o bajo el mínimo</span>
        </article>

        <article className="tarjeta">
          <span className="etiqueta">Agotados</span>
          <span className="valor">{totales.agotados}</span>
          <span className="detalle">Sin unidades disponibles</span>
        </article>
      </section>

      <section className="dos-columnas">
        <div className="panel">
          <header className="panel-cabecera">
            <h2>Últimas ventas</h2>
            <div className="acciones">
              <button
                type="button"
                className="boton secundario pequeno"
                onClick={() => irA('ventas')}
              >
                Ver historial
              </button>
            </div>
          </header>

          {datos.ultimasVentas.length === 0 ? (
            <div className="vacio">
              <Icono nombre="ventas" tamano={30} />
              <strong>Todavía no hay ventas registradas</strong>
              <span>Registra la primera venta desde el módulo de ventas.</span>
            </div>
          ) : (
            <div className="tabla-contenedor">
              <table>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Cliente</th>
                    <th>Fecha</th>
                    <th>Total</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.ultimasVentas.map((venta) => (
                    <tr key={venta._id}>
                      <td>
                        <strong>{venta.codigoVenta}</strong>
                      </td>
                      <td>
                        {venta.cliente
                          ? `${venta.cliente.nombre} ${venta.cliente.apellido}`
                          : 'Cliente eliminado'}
                      </td>
                      <td>{formatearFechaHora(venta.fechaVenta)}</td>
                      <td>
                        <strong>{formatearMoneda(venta.total)}</strong>
                      </td>
                      <td>
                        <span
                          className={`etiqueta-estado ${
                            venta.estado === 'REGISTRADA' ? 'ok' : 'neutra'
                          }`}
                        >
                          {venta.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="panel">
          <header className="panel-cabecera">
            <h2>Productos por reponer</h2>
            <div className="acciones">
              <button
                type="button"
                className="boton secundario pequeno"
                onClick={() => irA('alertas')}
              >
                Ver alertas
              </button>
            </div>
          </header>

          {productosBajoStock.length === 0 ? (
            <div className="vacio">
              <Icono nombre="check" tamano={30} />
              <strong>Sin alertas de stock</strong>
              <span>Todos los productos tienen existencias suficientes.</span>
            </div>
          ) : (
            <div className="tabla-contenedor">
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Stock</th>
                    <th>Mínimo</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {productosBajoStock.map((producto) => (
                    <tr key={producto._id}>
                      <td>
                        <div className="celda-principal">
                          <strong>{producto.nombre}</strong>
                          <span>{producto.codigo}</span>
                        </div>
                      </td>
                      <td>{producto.stock}</td>
                      <td>{producto.stockMinimo}</td>
                      <td>
                        <EtiquetaStock producto={producto} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="panel">
        <header className="panel-cabecera">
          <h2>Accesos rápidos</h2>
        </header>
        <div className="panel-cuerpo filtros">
          <button
            type="button"
            className="boton primario"
            onClick={() => irA('inventario')}
          >
            <Icono nombre="inventario" tamano={18} />
            Gestionar inventario
          </button>
          <button
            type="button"
            className="boton verde"
            onClick={() => irA('ventas')}
          >
            <Icono nombre="ventas" tamano={18} />
            Registrar venta
          </button>
          <button
            type="button"
            className="boton secundario"
            onClick={() => irA('clientes')}
          >
            <Icono nombre="clientes" tamano={18} />
            Administrar clientes
          </button>
        </div>
      </section>
    </>
  )
}
