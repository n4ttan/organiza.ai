const tracos = {
  hoje: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  faculdade: 'M5 4h13v16H7a2 2 0 01-2-2zM5 18a2 2 0 012-2h11',
  projetos: 'M3 6a1 1 0 011-1h5l2 2h9a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1z',
  financas: 'M4 7a2 2 0 012-2h11v3M4 7v10a2 2 0 002 2h13a1 1 0 001-1V9a1 1 0 00-1-1H6a2 2 0 01-2-1zM16 13.5h.01',
  ajustes: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4',
  cartao: 'M3 7a1 1 0 011-1h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1zM3 10h18M7 15h3',
  mais: 'M12 5v14M5 12h14',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  voltar: 'M15 5l-7 7 7 7',
  direita: 'M9 5l7 7-7 7',
  fechar: 'M6 6l12 12M18 6L6 18',
  lixo: 'M4 7h16M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3',
}

export default function Icone({ nome, tamanho = 24 }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
      <path d={tracos[nome]} />
    </svg>
  )
}
