import { useEffect, useState } from 'react'

import { formatearFecha, formatearMoneda, pedir } from '../api'
import Icono from '../componentes/Icono'
import Modal from '../componentes/Modal'

const PRODUCTO_VACIO = {
  nombre: '',
  codigo: '',
  categoria: '',
  descripcion: '',
  precioCompra: '',
  precioVenta: '',
  stock: '',
  stockMinimo: '',
  lote: '',
  fechaVencimiento: '',
  presentacion: '',
  estado: 'ACTIVO',
}

function productoParaFormulario(producto) {
  return {
    ...PRODUCTO_VACIO,
    ...producto,
    fechaVencimiento: producto.fechaVencimiento
      ? String(producto.fechaVencimiento).slice(0, 10)
      : '',
  }
}

function EtiquetaStock({ producto }) {
  if (producto.stock === 0) {
    return <span className="etiqueta-estado agotado">Agotado</span>
  }

  if (producto.stock <= producto.stockMinimo) {
    return <span className="etiqueta-estado bajo">Stock bajo</span>
  }

  return <span className="etiqueta-estado ok">Disponible</span>
}

export default function Inventario({ notificar }) {
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [filtros, setFiltros] = useState({ buscar: '', categoria: '', estado: '' })
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)
  const [formulario, setFormulario] = useState(PRODUCTO_VACIO)
  const [errorFormulario, setErrorFormulario] = useState('')
  const [guardando, setGuardando] = useState(false)

  async function cargarProductos() {
    const parametros = new URLSearchParams()
    if (filtros.buscar) parametros.set('buscar', filtros.buscar)
    if (filtros.categoria) parametros.set('categoria', filtros.categoria)
    if (filtros.estado) parametros.set('estado', filtros.estado)

    try {
      const datos = await pedir(`/productos?${parametros.toString()}`)
      setProductos(datos.productos)
      setError('')
    } catch (fallo) {
      setError(fallo.message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    const temporizador = setTimeout(cargarProductos, 250)
    return () => clearTimeout(temporizador)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros.buscar, filtros.categoria, filtros.estado])

  useEffect(() => {
    pedir('/productos/categorias')
      .then((datos) => setCategorias(datos.categorias))
      .catch(() => setCategorias([]))
  }, [])

  function abrirNuevo() {
    setFormulario({ ...PRODUCTO_VACIO })
    setErrorFormulario('')
    setModal({ modo: 'crear' })
  }

  function abrirEditar(producto) {
    setFormulario(productoParaFormulario(producto))
    setErrorFormulario('')
    setModal({ modo: 'editar', producto })
  }

  function cambiarCampo(campo, valor) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }))
  }

  async function guardar(evento) {
    evento.preventDefault()
    setErrorFormulario('')
    setGuardando(true)

    const cuerpo = {
      ...formulario,
      precioCompra: Number(formulario.precioCompra || 0),
      precioVenta: Number(formulario.precioVenta || 0),
      stock: Number(formulario.stock || 0),
      stockMinimo: Number(formulario.stockMinimo || 0),
    }

    try {
      if (modal.modo === 'crear') {
        await pedir('/productos', {
          method: 'POST',
          body: JSON.stringify(cuerpo),
        })
        notificar('Producto registrado correctamente')
      } else {
        await pedir(`/productos/${modal.producto._id}`, {
          method: 'PUT',
          body: JSON.stringify(cuerpo),
        })
        notificar('Producto actualizado correctamente')
      }

      setModal(null)
      await cargarProductos()
      const listaCategorias = await pedir('/productos/categorias')
      setCategorias(listaCategorias.categorias)
    } catch (fallo) {
      setErrorFormulario(fallo.message)
    } finally {
      setGuardando(false)
    }
  }

  async function cambiarEstado(producto) {
    const nuevoEstado = producto.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'

    try {
      await pedir(`/productos/${producto._id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado: nuevoEstado }),
      })
      notificar(
        nuevoEstado === 'ACTIVO'
          ? 'Producto activado'
          : 'Producto desactivado'
      )
      await cargarProductos()
    } catch (fallo) {
      notificar(fallo.message, 'error')
    }
  }

  async function eliminar(producto) {
    const confirmado = window.confirm(
      `¿Eliminar "${producto.nombre}"? Si tiene ventas o movimientos solo podrás desactivarlo.`
    )

    if (!confirmado) return

    try {
      await pedir(`/productos/${producto._id}`, { method: 'DELETE' })
      notificar('Producto eliminado')
      await cargarProductos()
    } catch (fallo) {
      notificar(fallo.message, 'error')
    }
  }

  return (
    <>
      <section className="panel">
        <header className="panel-cabecera">
          <h2>Catálogo de productos</h2>
          <div className="acciones">
            <button type="button" className="boton primario" onClick={abrirNuevo}>
              <Icono nombre="mas" tamano={18} />
              Nuevo producto
            </button>
          </div>
        </header>

        <div className="panel-cuerpo" style={{ paddingBottom: 0 }}>
          <div className="filtros" style={{ marginBottom: 16 }}>
            <div className="buscador">
              <Icono nombre="buscar" tamano={18} />
              <input
                type="search"
                placeholder="Buscar por nombre, código o descripción"
                value={filtros.buscar}
                onChange={(evento) =>
                  setFiltros((actual) => ({
                    ...actual,
                    buscar: evento.target.value,
                  }))
                }
              />
            </div>

            <select
              value={filtros.categoria}
              onChange={(evento) =>
                setFiltros((actual) => ({
                  ...actual,
                  categoria: evento.target.value,
                }))
              }
            >
              <option value="">Todas las categorías</option>
              {categorias.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {categoria}
                </option>
              ))}
            </select>

            <select
              value={filtros.estado}
              onChange={(evento) =>
                setFiltros((actual) => ({
                  ...actual,
                  estado: evento.target.value,
                }))
              }
            >
              <option value="">Todos los estados</option>
              <option value="ACTIVO">Activos</option>
              <option value="INACTIVO">Inactivos</option>
            </select>
          </div>
        </div>

        {error && <div className="alerta-error" style={{ margin: '0 20px 16px' }}>{error}</div>}

        {cargando ? (
          <div className="cargando">Cargando productos...</div>
        ) : productos.length === 0 ? (
          <div className="vacio">
            <Icono nombre="inventario" tamano={30} />
            <strong>No se encontraron productos</strong>
            <span>Registra un producto nuevo o cambia los filtros.</span>
          </div>
        ) : (
          <div className="tabla-contenedor">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Compra</th>
                  <th>Venta</th>
                  <th>Stock / mínimo</th>
                  <th>Vence</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((producto) => (
                  <tr key={producto._id}>
                    <td>
                      <strong>{producto.codigo}</strong>
                      <div className="texto-pequeno">{producto.lote}</div>
                    </td>
                    <td>
                      <div className="celda-principal">
                        <strong>{producto.nombre}</strong>
                        <span>{producto.presentacion}</span>
                      </div>
                    </td>
                    <td>{producto.categoria}</td>
                    <td>{formatearMoneda(producto.precioCompra)}</td>
                    <td>
                      <strong>{formatearMoneda(producto.precioVenta)}</strong>
                    </td>
                    <td>
                      <strong>
                        {producto.stock} / {producto.stockMinimo}
                      </strong>
                      <div style={{ marginTop: 4 }}>
                        <EtiquetaStock producto={producto} />
                      </div>
                    </td>
                    <td>{formatearFecha(producto.fechaVencimiento)}</td>
                    <td>
                      <span
                        className={`etiqueta-estado ${
                          producto.estado === 'ACTIVO' ? 'ok' : 'neutra'
                        }`}
                      >
                        {producto.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="acciones-tabla">
                        <button
                          type="button"
                          className="boton secundario pequeno"
                          onClick={() => abrirEditar(producto)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="boton secundario pequeno"
                          onClick={() => cambiarEstado(producto)}
                        >
                          {producto.estado === 'ACTIVO'
                            ? 'Desactivar'
                            : 'Activar'}
                        </button>
                        <button
                          type="button"
                          className="boton peligro pequeno"
                          onClick={() => eliminar(producto)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modal && (
        <Modal
          titulo={modal.modo === 'crear' ? 'Nuevo producto' : 'Editar producto'}
          alCerrar={() => setModal(null)}
          ancho="720px"
        >
          <form className="formulario" onSubmit={guardar}>
            {errorFormulario && (
              <div className="alerta-error">{errorFormulario}</div>
            )}

            <div className="rejilla-formulario">
              <div className="campo">
                <label>Nombre *</label>
                <input
                  value={formulario.nombre}
                  onChange={(evento) =>
                    cambiarCampo('nombre', evento.target.value)
                  }
                  placeholder="Paracetamol 500 mg"
                  required
                />
              </div>

              <div className="campo">
                <label>Código *</label>
                <input
                  value={formulario.codigo}
                  onChange={(evento) =>
                    cambiarCampo('codigo', evento.target.value)
                  }
                  placeholder="MED-001"
                  required
                />
              </div>

              <div className="campo">
                <label>Categoría *</label>
                <input
                  list="lista-categorias"
                  value={formulario.categoria}
                  onChange={(evento) =>
                    cambiarCampo('categoria', evento.target.value)
                  }
                  placeholder="Analgésicos"
                  required
                />
                <datalist id="lista-categorias">
                  {categorias.map((categoria) => (
                    <option key={categoria} value={categoria} />
                  ))}
                </datalist>
              </div>

              <div className="campo">
                <label>Presentación *</label>
                <input
                  value={formulario.presentacion}
                  onChange={(evento) =>
                    cambiarCampo('presentacion', evento.target.value)
                  }
                  placeholder="Caja x 10 tabletas"
                  required
                />
              </div>

              <div className="campo">
                <label>Precio de compra (S/) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formulario.precioCompra}
                  onChange={(evento) =>
                    cambiarCampo('precioCompra', evento.target.value)
                  }
                  required
                />
              </div>

              <div className="campo">
                <label>Precio de venta (S/) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formulario.precioVenta}
                  onChange={(evento) =>
                    cambiarCampo('precioVenta', evento.target.value)
                  }
                  required
                />
              </div>

              <div className="campo">
                <label>Stock actual *</label>
                <input
                  type="number"
                  min="0"
                  value={formulario.stock}
                  onChange={(evento) =>
                    cambiarCampo('stock', evento.target.value)
                  }
                  required
                />
              </div>

              <div className="campo">
                <label>Stock mínimo *</label>
                <input
                  type="number"
                  min="0"
                  value={formulario.stockMinimo}
                  onChange={(evento) =>
                    cambiarCampo('stockMinimo', evento.target.value)
                  }
                  required
                />
              </div>

              <div className="campo">
                <label>Lote *</label>
                <input
                  value={formulario.lote}
                  onChange={(evento) =>
                    cambiarCampo('lote', evento.target.value)
                  }
                  placeholder="LOTE-2026-01"
                  required
                />
              </div>

              <div className="campo">
                <label>Fecha de vencimiento *</label>
                <input
                  type="date"
                  value={formulario.fechaVencimiento}
                  onChange={(evento) =>
                    cambiarCampo('fechaVencimiento', evento.target.value)
                  }
                  required
                />
              </div>

              <div className="campo">
                <label>Estado</label>
                <select
                  value={formulario.estado}
                  onChange={(evento) =>
                    cambiarCampo('estado', evento.target.value)
                  }
                >
                  <option value="ACTIVO">Activo</option>
                  <option value="INACTIVO">Inactivo</option>
                </select>
              </div>

              <div className="campo ancho">
                <label>Descripción</label>
                <textarea
                  value={formulario.descripcion}
                  onChange={(evento) =>
                    cambiarCampo('descripcion', evento.target.value)
                  }
                  placeholder="Descripción opcional del producto"
                />
              </div>
            </div>

            <div className="modal-pie">
              <button
                type="button"
                className="boton secundario"
                onClick={() => setModal(null)}
              >
                Cancelar
              </button>
              <button type="submit" className="boton primario" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar producto'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
