# Pax - Saúde

App web para encontrar **consultas e exames na cidade de São Paulo** (foco na Avenida Paulista e arredores, incluindo a Lapa), ver como chegar e iniciar o agendamento pelo WhatsApp oficial do local.

**Acesse:** https://gabrielgoncalves5206-create.github.io/pax-saude/

## O que tem
- Dois locais: **Dimagem Unineuro** (Lapa) e **MITI** (1º andar do Horsa II, Conjunto Nacional, Av. Paulista, 2073)
- Cadastro obrigatório na primeira abertura: nome, celular e convênio (ou Particular). **Cada celular só pode ter um cadastro**: a regra é garantida no banco (`supabase/pax_cadastros.sql`, rodar uma vez)
- Fluxo: Consultas ou Exames → local → Agendar (só pergunta o exame, quando há mais de um, e o período) → mensagem pronta no WhatsApp
- Rota com partida e destino editáveis: a pé, bicicleta, carro e transporte público
- Acessibilidade: 3 tamanhos de letra, alto contraste, letra de leitura fácil, leitura em voz alta, modo simples, reduzir animações

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
- Rodar `supabase/pax_cadastros.sql` no Supabase (sem isso o cadastro não conclui)
- WhatsApp, telefone, horário e serviços do MITI
- Nome da empresa e e-mail de contato
- Termos de Uso e Política de Privacidade são rascunhos para revisão jurídica
