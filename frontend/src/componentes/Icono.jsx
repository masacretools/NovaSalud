const rutas = {
  dashboard:
    'M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z',
  inventario:
    'M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Zm9-2.6L6.2 7.5 12 10.1l5.8-2.6L12 4.9Zm-7 4.8v5.7l6 3v-5.7l-6-3Zm8 8.7 6-3v-5.7l-6 3v5.7Z',
  ventas:
    'M3 4h2.2l1.1 2H21l-2.4 7.2a2 2 0 0 1-1.9 1.4H8.1a2 2 0 0 1-1.9-1.4L4.2 6H3V4Zm5 5 1.2 3.6h7.6L18.3 9H8Zm-.5 9.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm9 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z',
  clientes:
    'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-3.3 0-6 1.8-6 4v3h12v-3c0-2.2-2.7-4-6-4Zm7-2a3 3 0 0 0 0-6v2a1 1 0 0 1 0 2v2Zm1 2.3c1.8.7 3 2 3 3.7v3h-4v-3c0-1.4-.5-2.7-1.4-3.7.8-.1 1.6 0 2.4 0Z',
  alertas:
    'M12 2a2 2 0 0 1 2 2v1.1a7 7 0 0 1 5 6.7V16l2 2v1H3v-1l2-2v-4.2a7 7 0 0 1 5-6.7V4a2 2 0 0 1 2-2Zm0 20a3 3 0 0 1-3-3h6a3 3 0 0 1-3 3Z',
  salir:
    'M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5v-2H5V5h5V3Zm4.6 4.6L19 12l-4.4 4.4-1.4-1.4 3-3-3-3 1.4-1.4ZM12 11h8v2h-8v-2Z',
  mas: 'M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z',
  buscar:
    'M10.5 3a7.5 7.5 0 1 0 4.6 13.4l4.3 4.3 1.4-1.4-4.3-4.3A7.5 7.5 0 0 0 10.5 3Zm0 2a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z',
  cerrar:
    'M6.4 5 5 6.4l5.6 5.6L5 17.6 6.4 19l5.6-5.6 5.6 5.6 1.4-1.4-5.6-5.6L19 6.4 17.6 5 12 10.6 6.4 5Z',
  editar:
    'M4 16.5V20h3.5L19 8.5 15.5 5 4 16.5ZM17.7 3.3a1.5 1.5 0 0 1 0 2.1l-1.2 1.2L13 4.1l1.2-1.2a1.5 1.5 0 0 1 2.1 0l1.4 1.4Z',
  basura:
    'M9 3h6l1 2h4v2H4V5h4l1-2ZM6 8h12l-1 13H7L6 8Zm4 3v7h1.5v-7H10Zm3.5 0v7H15v-7h-1.5Z',
  menu: 'M3 6h18v2H3V6Zm0 5h18v2H3v-2Zm0 5h18v2H3v-2Z',
  check: 'M9.5 17.5 4 12l1.4-1.4 4.1 4.1 9.1-9.2L20 7l-10.5 10.5Z',
}

export default function Icono({ nombre, tamano = 20, className = '' }) {
  return (
    <svg
      className={className}
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d={rutas[nombre] || rutas.check} />
    </svg>
  )
}
