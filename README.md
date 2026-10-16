# Bairro Livre — edição de navegador

Esta edição roda direto no navegador, sem instalação ou bibliotecas externas. Abra `index.html` para jogar localmente ou publique a pasta `bairro-livre/` junto com o site no GitHub Pages.

## Controles

- **WASD** ou **setas**: caminhar; no carro, acelerar, virar e dar ré.
- **E**: entrar/sair do carro, interagir com trabalhos ou iniciar uma corrida perto da largada.
- **Shift**: frear no carro.
- **F**: comer a comida selecionada; **1**, **2** e **3** selecionam o item da mochila.
- **G** e **B**: trocar ou comprar veículos perto do carro estacionado.
- **Esc**: fechar uma loja ou pausar o jogo.

Celulares e tablets têm controles de toque na página. No celular, use o botão ⛶ para alternar a tela cheia; o jogo tenta travar a orientação em paisagem quando o navegador permite, e os controles ficam nos cantos. Os pedestres circulam pela cidade após uma breve pausa, e colisões fortes com casas fazem o carro perder velocidade e rodar por um instante. O progresso fica salvo no armazenamento local do navegador e é independente do salvamento da edição Python. Use **Apagar progresso** no painel lateral para zerar dinheiro, itens, veículos, atividades e recorde; o jogo pede confirmação antes de apagar.

Esta é uma versão web própria do jogo, feita em Canvas e JavaScript. Ela mantém a exploração da cidade, pedestres, trânsito, lojas, comida, veículos, serviços e corridas; o áudio e o progresso são tratados pelo navegador.

## Roteiro de teste manual

- Inicie o jogo, pegue uma entrega e conclua-a; confira o avanço da atividade e a recompensa.
- Conclua 15 serviços para desbloquear as corridas; termine uma corrida e confira o recorde e a recompensa.
- Dirija em velocidade contra uma casa e confirme que a batida reduz a velocidade e faz o carro perder o controle por um instante.
- Recarregue a página e confira se dinheiro, veículos, itens, atividades e recorde continuam salvos.
- Use **Apagar progresso**: cancelar a confirmação deve manter tudo; confirmar deve voltar aos valores iniciais.
