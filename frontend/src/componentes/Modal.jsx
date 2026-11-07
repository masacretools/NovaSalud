import { useEffect } from 'react'
import Icono from './Icono'

export default function Modal({ titulo, alCerrar, children, ancho = '620px' }) {
  useEffect(() => {
    function alPresionar(evento) {
      if (evento.key === 'Escape') {
        alCerrar()
      }
    }

    document.addEventListener('keydown', alPresionar)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', alPresionar)
      document.body.style.overflow = ''
    }
  }, [alCerrar])

  return (
    <div className="modal-fondo" onMouseDown={alCerrar}>
      <div
        className="modal"
        style={{ maxWidth: ancho }}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onMouseDown={(evento) => evento.stopPropagation()}
      >
        <header className="modal-cabecera">
          <h2>{titulo}</h2>
          <button
            type="button"
            className="boton-icono"
            onClick={alCerrar}
            aria-label="Cerrar"
          >
            <Icono nombre="cerrar" />
          </button>
        </header>
        <div className="modal-cuerpo">{children}</div>
      </div>
    </div>
  )
}
