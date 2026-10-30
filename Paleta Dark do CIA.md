Circuito Inter-Atlético · App iOS do torcedor · Etapa 1

# Paleta Dark do CIA

Proposta para aprovação. Neutros escuros com leve viés verde, para conversar com o Lime sem parecer cinza genérico. O Lime marca ação e seleção; o Teal marca o que é da sua atlética. Estados usam cor *e* forma (ponto, ícone, texto, borda). Nada foi aplicado ao código.

## Superfícies

Quatro níveis de profundidade, do fundo para o elemento selecionado. Fundo base escuro, mas não preto puro, para evitar o halo do texto branco.

base

**Fundo base**`#0B0E0C`Telas, cabeçalhos, área rolável. Hoje: `appBackground` e `canvas`.

surface 1

**Superfície**`#151A17`Cartões de partida, linhas de lista, campos. Hoje: `surface`.

surface 2

**Superfície interna**`#1F2521`Caixas de placar, chips, botões de ícone, coisas dentro de cartões.

surface 3

**Selecionado / pressionado**`#2A312C`Linha escolhida, escudo, degrau do pódio. Hoje: `surfaceSelected`.

separator

**Separador**`#2E3631`Linhas finas entre itens. Decorativo, não precisa de 3:1.

border strong

**Borda forte**`#6B756F`Contornos interativos e botão secundário. 4,06:1 no fundo base, 3,69:1 na superfície.

## Texto e marca

Contraste medido com a fórmula WCAG. A HIG pede no mínimo 4,5:1 e recomenda 7:1 para texto pequeno em cores próprias.

| Token | Uso | base | surface 1 | surface 2 | surface 3 |
| --- | --- | --- | --- | --- | --- |
| texto primário `#F2F5F2` | Títulos, nomes, placar | 17,66 | 16,04 | 14,22 | 12,15 |
| texto secundário `#A7B0AA` | Legendas, cabeçalho de cartão, datas | 8,72 | 7,91 | 7,01 | 5,99 |
| texto terciário `#8A938D` | Quem perdeu, "a definir", desabilitado | 6,13 | 5,57 | 4,94 | 4,22 — não usar aqui |
| Lime `#B7F34B` | Ação principal, seleção, aba ativa | 14,72 | 13,37 | 11,85 | 10,12 |
| Teal `#2DD4BF` | Sua atlética de coração | 10,42 | 9,46 | 8,39 | 7,17 |
| Lime Strong `#52741A` | Só na variante clara | 3,50 | 3,08 | — | — |
| Teal Strong `#0F766E` | Só na variante clara | 3,47 | 3,05 | — | — |

Texto sobre Lime usa On Lime `#152211` (12,56:1). Lime Strong e Teal Strong não passam como texto no escuro; ficam reservados ao modo claro, onde passam com 5,4:1 sobre branco.

## Estados semânticos

Separados da marca. Cada um vem sempre com forma além da cor.

● AO VIVO

**Ao vivo**`#FF5C5C`Ponto pulsante, rótulo e borda do cartão. 6,41:1 no base.

✓ Notificações ativadas

**Sucesso**`#34D399`Confirmações e avisos rápidos, com ✓.

▲ Mudança de local

**Atenção**`#FBBF24`Mudanças de horário/local, resultados parciais.

⚠ Não foi possível carregar

**Erro**`#FF6B5E`Estados de erro em tela cheia, com ícone e texto.

## Como fica na Início

Simulação em HTML para julgar a paleta, não o layout final (componentes ganham forma nas Etapas 2 a 4). A barra de abas real será a nativa do iOS 26, com Liquid Glass.

Decisões para aprovar

### 1. Aparência: Dark fixo ou seguir o sistema

A HIG pede respeitar a escolha do sistema e reserva o Dark fixo para casos raros (mídia imersiva). Hoje o app está travado no claro (código e Info.plist).

Dark fixo no protótipo, mas cada cor nasce como Color Set com variante clara e de alto contraste, para o Liquid Glass se adaptar e para seguir o sistema depois sem retrabalho. Tirar a trava do Info.plist exige mexer no project.pbxproj; peço autorização na hora.

### 2. Cor do "ao vivo"

Vermelho é a convenção esportiva e se destaca sem disputar com a marca. Usar Lime daria mais identidade, mas o Lime já significa ação e seleção.

Vermelho `#FF5C5C`, sempre com ponto e rótulo. O erro fica num vermelho-coral próximo, mas só aparece em telas de erro, nunca ao lado de um jogo ao vivo.

### 3. Papel do Teal

Um significado só, como pede a HIG: tudo que é da sua atlética de coração (linha da Início, destaque no Ranking, escudo nos cartões, "Sua atlética").

Teal = sua atlética. Não usar Teal como sucesso nem em ícones genéricos.

### 4. Neutros com viés verde

Os cinzas têm um toque mínimo de verde (matiz \~140°) para harmonizar com o Lime. A alternativa é cinza neutro do sistema.

Manter o viés verde; é sutil e dá identidade sem perder legibilidade.

Depois da aprovação, a Etapa 1 cria os Color Sets, mapeia os nomes que já existem em Tokens.swift (as telas não mudam de código) e acrescenta só os papéis novos: marca, sobre-marca, sua atlética e os quatro estados.

9:41●●●

#### Copa Universitária

🔔*4*

⛉

Atlética de coração**Búfalos ▾**

Minha atlética

Geral

AO VIVOAtualizado há 8 s

Basquete Masculino

⛉

Búfalos

72:70

⛉

Imortal

4º Q · 04:55

**Últimos jogos**[Ver mais](#)

ONTEM, 15:00 · FUTSAL FEMININOENCERRADO

⛉

Búfalos

3:1

⛉

Imortal

✓ FemininoMasculinoMisto

▲ Parcial✓ Ativadas⚠ Erro

Entrar

Início

Cronograma

Ranking

Modalidades

## Variantes para o modo claro

Necessárias mesmo com o app fixo no escuro: a HIG pede variantes clara e escura para o Liquid Glass se adaptar. Medidas sobre fundo claro `#F4F6F3` e cartão branco.

| Papel | Escuro | Claro | Contraste no claro (fundo / cartão) |
| --- | --- | --- | --- |
| Texto primário | `#F2F5F2` | `#111511` | 16,96 / 18,43 |
| Texto secundário | `#A7B0AA` | `#4F5852` | 6,78 / 7,37 |
| Marca, texto e ícones | Lime `#B7F34B` | Lime Strong `#52741A` | 4,99 / 5,42 |
| Marca, preenchimento | Lime + On Lime | Lime + On Lime | 12,56 (texto sobre o Lime) |
| Sua atlética | Teal `#2DD4BF` | Teal Strong `#0F766E` | 5,04 / 5,47 |
| Ao vivo | `#FF5C5C` | `#CC2B2B` | 4,89 / 5,32 |