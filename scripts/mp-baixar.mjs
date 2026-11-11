import { writeFileSync, mkdirSync } from 'node:fs';
import { resumir } from './mp-relatorio.mjs';

const token = process.env.MP_TOKEN;
const headers = { Authorization: `Bearer ${token}` };

async function baixar() {
  const reqLista = await fetch('https://api.mercadopago.com/v1/account/release_report/list', { headers });
  const lista = await reqLista.json();
  
  // Procura o primeiro relatório que já tenha um nome de arquivo gerado
  const pronto = lista.find(r => r.file_name);
  
  if (!pronto) {
    console.log('Nenhum relatório pronto ainda. Status da fila:');
    console.log(lista.slice(0, 3).map(r => ({ id: r.id, status: r.status, date: r.date_created })));
    return;
  }
  
  console.log(`Relatório encontrado! Baixando: ${pronto.file_name}...`);
  const reqCsv = await fetch(`https://api.mercadopago.com/v1/account/release_report/${pronto.file_name}`, { headers });
  const csv = await reqCsv.text();
  
  mkdirSync('docs/notas', { recursive: true });
  writeFileSync('docs/notas/mp-release-report.csv', csv);
  console.log('Salvo em docs/notas/mp-release-report.csv');
  console.log(JSON.stringify(resumir(csv), null, 2));
}

baixar();
