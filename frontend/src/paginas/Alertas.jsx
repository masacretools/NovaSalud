import { useEffect, useState } from 'react'

import { formatearFecha, pedir } from '../api'
import Icono from '../componentes/Icono'

function diferenciaEnDias(fecha) {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const objetivo = new Date(fecha)
  objetivo.setHours(0, 0, 0, 0)
  return Math.round((objetivo - hoy) / (1000 * 60 * 60 * 24))
}

function EtiquetaVencimiento({ fechaVencimiento }) {
  const dias = diferenciaEnDias(fechaVencimiento)

  if (dias < 0) {
    return <span className="etiqueta-estado agotado">Vencido</span>
  }

  if (dias <= 30) {
    return (
      <span className="etiqueta-estado bajo">Vence en {dias} día(s)</span>
    )
  }

  return (
    <span className="etiqueta-estado info">Vence en {dias} día(s)</span>
  )
}

export default function Alertas({ irA }) {
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let activo = true

    pedir('/dashboard/alertas')
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
    return <div className="cargando">Revisando el inventario...</div>
  }

  if (error) {
    return <div className="alerta-error">{error}</div>
  }

  return (
    <>
      <section className="tarjetas">
        <article className="tarjeta">
          <span className="etiqueta">Stock bajo</span>
          <span className="valor">{datos.resumen.stockBajo}</span>
          <span className="detalle">Productos igual o bajo el mínimo</span>
        </article>
        <article className="tarjeta">
          <span className="etiqueta">Agotados</span>
          <span className="valor">{datos.resumen.agotados}</span>
          <span className="detalle">Sin unidades en almacén</span>
        </article>
        <article className="tarjeta">
          <span className="etiqueta">Por vencer</span>
          <span className="valor">{datos.resumen.porVencer}</span>
          <span className="detalle">Vencen en los próximos 90 días</span>
        </article>
      </section>

      <div className="alerta-grupo">
        <section className="panel">
          <header className="panel-cabecera">
            <div className="alerta-titulo">
              <span className="punto" />
              <h2>Productos con stock bajo</h2>
            </div>
          </header>

          {datos.stockBajo.length === 0 ? (
            <div className="vacio">
              <Icono nombre="check" tamano={28} />
              <strong>Sin productos con stock bajo</strong>
            </div>
          ) : (
            <div className="tabla-contenedor">
              <table>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Stock</th>
                    <th>Mínimo</th>
                    <th>Faltante</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.stockBajo.map((producto) => (
                    <tr key={producto._id}>
                      <td>{producto.codigo}</td>
                      <td>
                        <strong>{producto.nombre}</strong>
                      </td>
                      <td>{producto.categoria}</td>
                      <td>
                        <span className="etiqueta-estado bajo">
                          {producto.stock}
                        </span>
                      </td>
                      <td>{producto.stockMinimo}</td>
                      <td>{Math.max(producto.stockMinimo - producto.stock, 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel">
          <header className="panel-cabecera">
            <div className="alerta-titulo">
              <span className="punto rojo" />
              <h2>Productos agotados</h2>
            </div>
          </header>

          {datos.agotados.length === 0 ? (
            <div className="vacio">
              <Icono nombre="check" tamano={28} />
              <strong>No hay productos agotados</strong>
            </div>
          ) : (
            <div className="tabla-contenedor">
              <table>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Stock mínimo</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.agotados.map((producto) => (
                    <tr key={producto._id}>
                      <td>{producto.codigo}</td>
                      <td>
                        <strong>{producto.nombre}</strong>
                      </td>
                      <td>{producto.categoria}</td>
                      <td>{producto.stockMinimo}</td>
                      <td>
                        <span className="etiqueta-estado agotado">Agotado</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel">
          <header className="panel-cabecera">
            <div className="alerta-titulo">
              <span className="punto azul" />
              <h2>Próximos vencimientos</h2>
            </div>
            <div className="acciones">
              <button
                type="button"
                className="boton secundario pequeno"
                onClick={() => irA('inventario')}
              >
                Ir al inventario
              </button>
            </div>
          </header>

          {datos.porVencer.length === 0 ? (
            <div className="vacio">
              <Icono nombre="check" tamano={28} />
              <strong>Sin productos próximos a vencer</strong>
            </div>
          ) : (
            <div className="tabla-contenedor">
              <table>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Producto</th>
                    <th>Lote</th>
                    <th>Stock</th>
                    <th>Fecha de vencimiento</th>
                    <th>Situación</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.porVencer.map((producto) => (
                    <tr key={producto._id}>
                      <td>{producto.codigo}</td>
                      <td>
                        <strong>{producto.nombre}</strong>
                      </td>
                      <td>{producto.lote}</td>
                      <td>{producto.stock}</td>
                      <td>{formatearFecha(producto.fechaVencimiento)}</td>
                      <td>
                        <EtiquetaVencimiento
                          fechaVencimiento={producto.fechaVencimiento}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  )
}
