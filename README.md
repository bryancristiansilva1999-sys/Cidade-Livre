# Bairro Livre — edição de navegador

Esta edição roda direto no navegador, sem instalação ou bibliotecas externas. Abra `index.html` para jogar localmente ou publique a pasta `bairro-livre/` junto com o site no GitHub Pages.

## Controles

- **WASD** ou **setas**: caminhar; no carro, acelerar, virar e dar ré. Ao fazer curvas, o carro reduz a velocidade automaticamente.
- **Espaço + A/D** em alta velocidade: fazer drift; solte o espaço para recuperar a direção.
- **R**: voltar para o início da cidade sem apagar dinheiro, veículos ou missões.
- **E**: entrar/sair do carro, interagir com trabalhos ou iniciar uma corrida perto da largada.
- **Shift**: frear no carro.
- **F**: comer a comida selecionada; **1**, **2** e **3** selecionam o item da mochila.
- **G** e **B**: trocar ou comprar veículos perto do carro estacionado.
- **Esc**: fechar uma loja ou pausar o jogo.

Celulares e tablets têm controles de toque na página. No celular, use o botão ⛶ para alternar a tela cheia; o jogo tenta travar a orientação em paisagem quando o navegador permite, e os controles ficam nos cantos. Os pedestres circulam pela cidade após uma breve pausa. Há 45 carros de trânsito distribuídos por diferentes ruas; eles escolhem aleatoriamente se seguem em frente ou viram em cada cruzamento. Sete desses carros participam das corridas, mantendo o tamanho original dos grids. O carro do jogador e os carros de trânsito e corrida respeitam as colisões com casas e lojas; batidas fortes reduzem a velocidade e fazem o carro do jogador perder o controle por um instante. O progresso fica salvo no armazenamento local do navegador e é independente do salvamento da edição Python. Use **Apagar progresso** no painel lateral para zerar dinheiro, itens, veículos, atividades e recorde; o jogo pede confirmação antes de apagar.

Bater com velocidade em dois carros comuns do trânsito chama uma viatura com luzes e sirene. A velocidade da viatura acompanha a do jogador e aumenta quando precisa reduzir a distância; ela pode derrapar em curvas e deixa marcas de pneu. Se o jogador abrir uma distância de dois quarteirões (740 unidades), despista a polícia e a perseguição termina. Se a viatura encostar nele cinco vezes antes disso, leva até $30 e o jogador volta ao início da cidade. As colisões durante corridas não contam para chamar a polícia.

Esta é uma versão web própria do jogo, feita em Canvas e JavaScript. Ela mantém a exploração da cidade, pedestres, trânsito, lojas, comida, veículos, serviços e corridas; o áudio e o progresso são tratados pelo navegador.

## Roteiro de teste manual

- Inicie o jogo, pegue uma entrega e conclua-a; confira o avanço da atividade e a recompensa.
- Conclua 15 serviços para desbloquear as corridas; termine uma corrida e confira o recorde e a recompensa.
- Dirija em alta velocidade, segure **Espaço** e vire com **A/D** para derrapar; solte o espaço e confira se o carro recupera a direção.
- Pressione **R** e confira se jogador e carro voltam ao início sem perder o progresso.
- Bata com velocidade em dois carros diferentes do trânsito; confira a viatura, as luzes e a sirene. Afaste-se por dois quarteirões e confira se a perseguição termina; em outra tentativa, deixe a viatura tocar em você cinco vezes e confirme a cobrança de até $30 e o retorno ao início.
- Dirija em velocidade contra uma casa e confirme que a batida reduz a velocidade e faz o carro perder o controle por um instante.
- Recarregue a página e confira se dinheiro, veículos, itens, atividades e recorde continuam salvos.
- Use **Apagar progresso**: cancelar a confirmação deve manter tudo; confirmar deve voltar aos valores iniciais.
