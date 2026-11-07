# Pax - Saúde

App web para encontrar **consultas e exames na cidade de São Paulo** (foco na Avenida Paulista e arredores, incluindo a Lapa), ver como chegar e iniciar o agendamento pelo WhatsApp oficial do local.

**Acesse:** https://gabrielgoncalves5206-create.github.io/pax-saude/

## O que tem
- 120 locais e serviços (hospitais, clínicas, médicos, laboratórios, diagnóstico por imagem e teleconsulta)
- Fluxo: Consultas → Presencial/Online → especialidade · Exames → Laboratoriais/Imagem → exame
- WhatsApp com mensagem pronta (só onde é oficial); nos demais, "Ligar"
- Rota com partida e destino editáveis: a pé, bicicleta, carro (OSRM) e transporte público
- Nota do Google Maps (com data) e botão "Avaliar no Google Maps"
- Redes sociais oficiais de cada local
- Fotos: site oficial → Mapillary → Wikimedia Commons → miniatura do mapa
- Acessibilidade: 3 tamanhos de letra, alto contraste, letra de leitura fácil, leitura em voz alta, busca por voz, modo simples, reduzir animações
- Perfil com nome, celular e dependentes (dados ficam só no aparelho)

## Estrutura
- `index.html` — app completo em um arquivo (é o que o GitHub Pages publica)
- `src/shell.html` — HTML e CSS
- `src/dados.js` — base de locais (fonte em cada registro, pesquisa de nov/2026)
- `src/app.js` — lógica e telas
- `src/build.py` — junta os três em `index.html`: `python3 src/build.py`

## Configuração
No início de `src/app.js`, o objeto `CFG` guarda:
- `mapillary`: token de cliente do Mapillary (fotos de rua). Também pode ser colado no app em Menu › Fontes e créditos.
- `empresa` e `email`: nome da empresa e e-mail de contato (ainda a definir).

## Pendências
- Nome da empresa e e-mail de contato
- Termos de Uso e Política de Privacidade são rascunhos para revisão jurídica
