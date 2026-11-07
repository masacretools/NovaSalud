import { useEffect, useMemo, useState } from 'react'

import {
  formatearFechaHora,
  formatearMoneda,
  pedir,
} from '../api'
import Icono from '../componentes/Icono'
import Modal from '../componentes/Modal'

const METODOS_PAGO = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'YAPE', 'PLIN']

export default function Ventas({ notificar }) {
  const [productos, setProductos] = useState([])
  const [clientes, setClientes] = useState([])
  const [ventas, setVentas] = useState([])
  const [buscar, setBuscar] = useState('')
  const [carrito, setCarrito] = useState([])
  const [cliente, setCliente] = useState('')
  const [metodoPago, setMetodoPago] = useState('EFECTIVO')
  const [registrando, setRegistrando] = useState(false)
  const [error, setError] = useState('')
  const [detalle, setDetalle] = useState(null)
  const [cargando, setCargando] = useState(true)

  async function cargarDatos() {
    try {
      const [listaProductos, listaClientes, listaVentas] = await Promise.all([
        pedir('/productos?estado=ACTIVO'),
        pedir('/clientes'),
        pedir('/ventas'),
      ])
      setProductos(listaProductos.productos)
      setClientes(listaClientes.clientes)
      setVentas(listaVentas.ventas)
    } catch (fallo) {
      setError(fallo.message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    let activo = true

    Promise.all([
      pedir('/productos?estado=ACTIVO'),
      pedir('/clientes'),
      pedir('/ventas'),
    ])
      .then(([listaProductos, listaClientes, listaVentas]) => {
        if (!activo) return
        setProductos(listaProductos.productos)
        setClientes(listaClientes.clientes)
        setVentas(listaVentas.ventas)
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

  const productosFiltrados = useMemo(() => {
    const texto = buscar.trim().toLowerCase()
    if (!texto) return productos.slice(0, 8)

    return productos
      .filter(
        (producto) =>
          producto.nombre.toLowerCase().includes(texto) ||
          producto.codigo.toLowerCase().includes(texto) ||
          producto.categoria.toLowerCase().includes(texto)
      )
      .slice(0, 10)
  }, [productos, buscar])

  const total = useMemo(
    () =>
      Number(
        carrito
          .reduce(
            (suma, item) => suma + item.cantidad * item.producto.precioVenta,
            0
          )
          .toFixed(2)
      ),
    [carrito]
  )

  function agregar(producto) {
    if (producto.stock <= 0) {
      notificar('El producto está agotado', 'error')
      return
    }

    setCarrito((actual) => {
      const existente = actual.find(
        (item) => item.producto._id === producto._id
      )

      if (existente) {
        if (existente.cantidad + 1 > producto.stock) {
          notificar(
            `Solo hay ${producto.stock} unidades de ${producto.nombre}`,
            'error'
          )
          return actual
        }

        return actual.map((item) =>
          item.producto._id === producto._id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      }

      return [...actual, { producto, cantidad: 1 }]
    })
  }

  function cambiarCantidad(productoId, valor) {
    const cantidad = Number(valor)

    setCarrito((actual) =>
      actual.map((item) => {
        if (item.producto._id !== productoId) return item

        const limite = item.producto.stock
        const nueva = Math.min(Math.max(1, Math.trunc(cantidad) || 1), limite)

        return { ...item, cantidad: nueva }
      })
    )
  }

  function quitar(productoId) {
    setCarrito((actual) =>
      actual.filter((item) => item.producto._id !== productoId)
    )
  }

  async function registrarVenta(evento) {
    evento.preventDefault()
    setError('')

    if (carrito.length === 0) {
      setError('Agrega al menos un producto al carrito')
      return
    }

    if (!cliente) {
      setError('Selecciona un cliente para registrar la venta')
      return
    }

    setRegistrando(true)

    try {
      const datos = await pedir('/ventas', {
        method: 'POST',
        body: JSON.stringify({
          cliente,
          metodoPago,
          productos: carrito.map((item) => ({
            producto: item.producto._id,
            cantidad: item.cantidad,
          })),
        }),
      })

      notificar(
        `Venta ${datos.venta.codigoVenta} registrada por ${formatearMoneda(
          datos.venta.total
        )}`
      )
      setCarrito([])
      setCliente('')
      setMetodoPago('EFECTIVO')
      setBuscar('')
      await cargarDatos()
    } catch (fallo) {
      setError(fallo.message)
      notificar(fallo.message, 'error')
    } finally {
      setRegistrando(false)
    }
  }

  if (cargando) {
    return <div className="cargando">Cargando módulo de ventas...</div>
  }

  return (
    <>
      {error && <div className="alerta-error">{error}</div>}

      <section className="venta-diseno">
        <div className="panel">
          <header className="panel-cabecera">
            <h2>Buscar productos</h2>
            <div className="acciones">
              <span className="texto-pequeno">{productos.length} activos</span>
            </div>
          </header>
          <div className="panel-cuerpo" style={{ display: 'grid', gap: 14 }}>
            <div className="buscador">
              <Icono nombre="buscar" tamano={18} />
              <input
                type="search"
                placeholder="Nombre, código o categoría"
                value={buscar}
                onChange={(evento) => setBuscar(evento.target.value)}
              />
            </div>

            <div className="lista-productos-venta">
              {productosFiltrados.length === 0 ? (
                <div className="vacio">
                  <strong>No se encontraron productos</strong>
                  <span>Registra productos en el inventario.</span>
                </div>
              ) : (
                productosFiltrados.map((producto) => (
                  <div className="fila-producto-venta" key={producto._id}>
                    <div className="datos">
                      <strong>{producto.nombre}</strong>
                      <span>
                        {producto.codigo} · Stock {producto.stock}
                      </span>
                    </div>
                    <span className="precio">
                      {formatearMoneda(producto.precioVenta)}
                    </span>
                    <button
                      type="button"
                      className="boton verde pequeno"
                      onClick={() => agregar(producto)}
                      disabled={producto.stock <= 0}
                    >
                      Agregar
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <form className="panel" onSubmit={registrarVenta}>
          <header className="panel-cabecera">
            <h2>Carrito de venta</h2>
            <div className="acciones">
              <span className="texto-pequeno">
                {carrito.length} producto(s)
              </span>
            </div>
          </header>

          <div className="panel-cuerpo carrito">
            {carrito.length === 0 ? (
              <div className="vacio">
                <Icono nombre="ventas" tamano={30} />
                <strong>El carrito está vacío</strong>
                <span>Agrega productos desde la lista de la izquierda.</span>
              </div>
            ) : (
              <div className="carrito-tabla">
                {carrito.map((item) => (
                  <div className="carrito-fila" key={item.producto._id}>
                    <div>
                      <strong>{item.producto.nombre}</strong>
                      <small>
                        {formatearMoneda(item.producto.precioVenta)} · máx.{' '}
                        {item.producto.stock}
                      </small>
                    </div>
                    <input
                      type="number"
                      min="1"
                      max={item.producto.stock}
                      value={item.cantidad}
                      onChange={(evento) =>
                        cambiarCantidad(item.producto._id, evento.target.value)
                      }
                      aria-label={`Cantidad de ${item.producto.nombre}`}
                    />
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <strong style={{ minWidth: 70, textAlign: 'right' }}>
                        {formatearMoneda(
                          item.cantidad * item.producto.precioVenta
                        )}
                      </strong>
                      <button
                        type="button"
                        className="boton-icono"
                        onClick={() => quitar(item.producto._id)}
                        aria-label={`Quitar ${item.producto.nombre}`}
                      >
                        <Icono nombre="cerrar" tamano={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="campo">
              <label>Cliente *</label>
              <select
                value={cliente}
                onChange={(evento) => setCliente(evento.target.value)}
                required
              >
                <option value="">Selecciona un cliente</option>
                {clientes.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.apellido}, {item.nombre} · {item.tipoDocumento}{' '}
                    {item.numeroDocumento}
                  </option>
                ))}
              </select>
              {clientes.length === 0 && (
                <small>
                  No hay clientes registrados. Créalos desde el módulo Clientes.
                </small>
              )}
            </div>

            <div className="campo">
              <label>Método de pago *</label>
              <select
                value={metodoPago}
                onChange={(evento) => setMetodoPago(evento.target.value)}
              >
                {METODOS_PAGO.map((metodo) => (
                  <option key={metodo} value={metodo}>
                    {metodo}
                  </option>
                ))}
              </select>
            </div>

            <div className="total-venta">
              <span>Total a pagar</span>
              <strong>{formatearMoneda(total)}</strong>
            </div>

            <button
              type="submit"
              className="boton verde"
              disabled={registrando || carrito.length === 0}
            >
              {registrando ? 'Registrando venta...' : 'Registrar venta y descontar stock'}
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <header className="panel-cabecera">
          <h2>Historial de ventas</h2>
          <div className="acciones">
            <span className="texto-pequeno">{ventas.length} venta(s)</span>
          </div>
        </header>

        {ventas.length === 0 ? (
          <div className="vacio">
            <Icono nombre="ventas" tamano={30} />
            <strong>Todavía no hay ventas</strong>
            <span>Registra la primera venta desde el carrito.</span>
          </div>
        ) : (
          <div className="tabla-contenedor">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Empleado</th>
                  <th>Productos</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((venta) => (
                  <tr key={venta._id}>
                    <td>
                      <strong>{venta.codigoVenta}</strong>
                    </td>
                    <td>{formatearFechaHora(venta.fechaVenta)}</td>
                    <td>
                      {venta.cliente
                        ? `${venta.cliente.nombre} ${venta.cliente.apellido}`
                        : '—'}
                    </td>
                    <td>
                      {venta.empleado
                        ? `${venta.empleado.nombre} ${venta.empleado.apellido}`
                        : '—'}
                    </td>
                    <td>{venta.productos.length}</td>
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
                    <td>
                      <button
                        type="button"
                        className="boton secundario pequeno"
                        onClick={() => setDetalle(venta)}
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {detalle && (
        <Modal
          titulo={`Venta ${detalle.codigoVenta}`}
          alCerrar={() => setDetalle(null)}
          ancho="640px"
        >
          <div style={{ display: 'grid', gap: 16 }}>
            <div className="resumen-venta">
              <span>
                Fecha: <strong>{formatearFechaHora(detalle.fechaVenta)}</strong>
              </span>
              <span>
                Cliente:{' '}
                <strong>
                  {detalle.cliente
                    ? `${detalle.cliente.nombre} ${detalle.cliente.apellido}`
                    : '—'}
                </strong>
              </span>
              <span>
                Pago: <strong>{detalle.metodoPago}</strong>
              </span>
            </div>

            <div className="tabla-contenedor">
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio unitario</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {detalle.productos.map((item) => (
                    <tr key={`${item.producto}-${item.nombreProducto}`}>
                      <td>{item.nombreProducto}</td>
                      <td>{item.cantidad}</td>
                      <td>{formatearMoneda(item.precioUnitario)}</td>
                      <td>
                        <strong>{formatearMoneda(item.subtotal)}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="total-venta">
              <span>Total de la venta</span>
              <strong>{formatearMoneda(detalle.total)}</strong>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
