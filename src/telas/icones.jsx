const tracos = {
  hoje: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  faculdade: 'M5 4h13v16H7a2 2 0 01-2-2zM5 18a2 2 0 012-2h11',
  projetos: 'M3 6a1 1 0 011-1h5l2 2h9a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1z',
  ajustes: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4',
  mais: 'M12 5v14M5 12h14',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  voltar: 'M15 5l-7 7 7 7',
  fechar: 'M6 6l12 12M18 6L6 18',
  lixo: 'M4 7h16M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3',
}

export default function Icone({ nome }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={tracos[nome]} />
    </svg>
  )
}
