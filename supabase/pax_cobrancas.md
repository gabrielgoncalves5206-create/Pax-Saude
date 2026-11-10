# Adiantamento (Pax Saúde Particular)

Tabela `pax_cobrancas` + função `pax-cobranca` (Supabase). Fica desativado até preencher em `pax_config`:

| chave | valor |
|---|---|
| `pay_provider` | `mercadopago` ou `asaas` |
| `mp_token` | Access Token do Mercado Pago |
| `asaas_key` | Chave de API do Asaas |
| `adiant_valor` | Valor do adiantamento, ex.: `50.00` |

Webhooks: Mercado Pago → `…/functions/v1/pax-cobranca?wh=mp`; Asaas → `…/functions/v1/pax-cobranca?wh=asaas` com o token `asaas_webhook_token`.
