import { useEffect, useState } from 'react'

import { formatearFecha, pedir } from '../api'
import Icono from '../componentes/Icono'
import Modal from '../componentes/Modal'

const CLIENTE_VACIO = {
  nombre: '',
  apellido: '',
  tipoDocumento: 'DNI',
  numeroDocumento: '',
  telefono: '',
  correo: '',
  direccion: '',
}

export default function Clientes({ notificar }) {
  const [clientes, setClientes] = useState([])
  const [buscar, setBuscar] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)
  const [formulario, setFormulario] = useState(CLIENTE_VACIO)
  const [errorFormulario, setErrorFormulario] = useState('')
  const [guardando, setGuardando] = useState(false)

  async function cargarClientes() {
    try {
      const parametros = buscar ? `?buscar=${encodeURIComponent(buscar)}` : ''
      const datos = await pedir(`/clientes${parametros}`)
      setClientes(datos.clientes)
      setError('')
    } catch (fallo) {
      setError(fallo.message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    const temporizador = setTimeout(cargarClientes, 250)
    return () => clearTimeout(temporizador)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscar])

  function abrirNuevo() {
    setFormulario({ ...CLIENTE_VACIO })
    setErrorFormulario('')
    setModal({ modo: 'crear' })
  }

  function abrirEditar(cliente) {
    setFormulario({ ...CLIENTE_VACIO, ...cliente })
    setErrorFormulario('')
    setModal({ modo: 'editar', cliente })
  }

  function cambiarCampo(campo, valor) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }))
  }

  async function guardar(evento) {
    evento.preventDefault()
    setErrorFormulario('')
    setGuardando(true)

    try {
      if (modal.modo === 'crear') {
        await pedir('/clientes', {
          method: 'POST',
          body: JSON.stringify(formulario),
        })
        notificar('Cliente registrado correctamente')
      } else {
        await pedir(`/clientes/${modal.cliente._id}`, {
          method: 'PUT',
          body: JSON.stringify(formulario),
        })
        notificar('Cliente actualizado correctamente')
      }

      setModal(null)
      await cargarClientes()
    } catch (fallo) {
      setErrorFormulario(fallo.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <>
      <section className="panel">
        <header className="panel-cabecera">
          <h2>Directorio de clientes</h2>
          <div className="acciones">
            <button type="button" className="boton primario" onClick={abrirNuevo}>
              <Icono nombre="mas" tamano={18} />
              Nuevo cliente
            </button>
          </div>
        </header>

        <div className="panel-cuerpo" style={{ paddingBottom: 0 }}>
          <div className="filtros" style={{ marginBottom: 16 }}>
            <div className="buscador">
              <Icono nombre="buscar" tamano={18} />
              <input
                type="search"
                placeholder="Buscar por nombre, apellido o documento"
                value={buscar}
                onChange={(evento) => setBuscar(evento.target.value)}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="alerta-error" style={{ margin: '0 20px 16px' }}>
            {error}
          </div>
        )}

        {cargando ? (
          <div className="cargando">Cargando clientes...</div>
        ) : clientes.length === 0 ? (
          <div className="vacio">
            <Icono nombre="clientes" tamano={30} />
            <strong>No hay clientes registrados</strong>
            <span>Registra un cliente para poder realizar ventas.</span>
          </div>
        ) : (
          <div className="tabla-contenedor">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Documento</th>
                  <th>Teléfono</th>
                  <th>Correo</th>
                  <th>Dirección</th>
                  <th>Registro</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente) => (
                  <tr key={cliente._id}>
                    <td>
                      <div className="celda-principal">
                        <strong>
                          {cliente.apellido}, {cliente.nombre}
                        </strong>
                      </div>
                    </td>
                    <td>
                      {cliente.tipoDocumento} {cliente.numeroDocumento}
                    </td>
                    <td>{cliente.telefono || '—'}</td>
                    <td>{cliente.correo || '—'}</td>
                    <td>{cliente.direccion || '—'}</td>
                    <td>{formatearFecha(cliente.fechaCreacion)}</td>
                    <td>
                      <button
                        type="button"
                        className="boton secundario pequeno"
                        onClick={() => abrirEditar(cliente)}
                      >
                        Editar
                      </button>
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
          titulo={modal.modo === 'crear' ? 'Nuevo cliente' : 'Editar cliente'}
          alCerrar={() => setModal(null)}
          ancho="640px"
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
                  onChange={(evento) => cambiarCampo('nombre', evento.target.value)}
                  required
                />
              </div>

              <div className="campo">
                <label>Apellido *</label>
                <input
                  value={formulario.apellido}
                  onChange={(evento) =>
                    cambiarCampo('apellido', evento.target.value)
                  }
                  required
                />
              </div>

              <div className="campo">
                <label>Tipo de documento *</label>
                <select
                  value={formulario.tipoDocumento}
                  onChange={(evento) =>
                    cambiarCampo('tipoDocumento', evento.target.value)
                  }
                >
                  <option value="DNI">DNI</option>
                  <option value="CE">Carné de extranjería</option>
                  <option value="RUC">RUC</option>
                  <option value="PASAPORTE">Pasaporte</option>
                </select>
              </div>

              <div className="campo">
                <label>Número de documento *</label>
                <input
                  value={formulario.numeroDocumento}
                  onChange={(evento) =>
                    cambiarCampo('numeroDocumento', evento.target.value)
                  }
                  minLength={8}
                  placeholder="12345678"
                  required
                />
              </div>

              <div className="campo">
                <label>Teléfono</label>
                <input
                  value={formulario.telefono}
                  onChange={(evento) =>
                    cambiarCampo('telefono', evento.target.value)
                  }
                  placeholder="999999999"
                />
              </div>

              <div className="campo">
                <label>Correo</label>
                <input
                  type="email"
                  value={formulario.correo}
                  onChange={(evento) => cambiarCampo('correo', evento.target.value)}
                  placeholder="cliente@correo.com"
                />
              </div>

              <div className="campo ancho">
                <label>Dirección</label>
                <input
                  value={formulario.direccion}
                  onChange={(evento) =>
                    cambiarCampo('direccion', evento.target.value)
                  }
                  placeholder="Av. Ejemplo 123, Lima"
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
                {guardando ? 'Guardando...' : 'Guardar cliente'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
