// contribua.js
document.addEventListener('DOMContentLoaded', () => {
  // — Dados falsos para PIX —
  const firstNames = ["Ana","Bruno","Carla","Daniel","Eva","Fabio","Gabi","Hugo","Iara","João","Karen","Léo","Mariana","Nina","Otávio","Paula","Quésia","Rafael","Sofia","Tiago","Úrsula","Vitor","Wendy","Xavier","Yara","Zeca","Alice","Bernardo","Camila","Diego","Elisa","Fernando","Giulia","Heitor","Isabel","Júlio","Kelly","Lucas","Marina","Natália","Pedro","Priscila","Rogério","Raissa","Samuel","Sara","Talita","Thales","Vanessa","Victor","Yuri","Yasmin"];
  const lastNames  = ["Silva","Souza","Costa","Almeida","Pereira","Oliveira","Lima","Gomes","Ramos","Martins","Araújo","Barbosa","Melo","Carvalho","Fernandes","Rocha","Dias","Teixeira","Moreira","Freitas","Pinto","Castro","Azevedo","Campos","Ribeiro","Mendes","Fonseca","Cardoso","Galvão","Faria","Castilho","Rezende","Lopes","Bezerra","Machado","Cavalcanti","Moura","Nogueira","Cunha","Figueiredo"];
  function randomName(){ return firstNames[Math.random()*firstNames.length|0]+' '+lastNames[Math.random()*lastNames.length|0]; }
  function randomCPF(){
    const nums = Array.from({length:9},()=>Math.floor(Math.random()*10));
    const calc = arr => {
      const sum = arr.reduce((s,d,i)=> s + d*(arr.length+1-i), 0);
      const r = sum % 11;
      return r<2?0:11-r;
    };
    const d1 = calc(nums), d2 = calc(nums.concat(d1));
    return nums.concat(d1,d2).join('');
  }
  function randomEmail(){ return Math.random().toString(36).substr(2,6) + '@example.com'; }
  function randomPhone(){
    const ddd = String(11 + Math.random()*89|0).padStart(2,'0');
    const rest = String(Math.random()*90000000|10000000);
    return ddd + rest;
  }

  // — Selectors e limites —
  const amtEl   = document.getElementById('amount'),
        btn     = document.getElementById('contributeBtn'),
        errEl   = document.getElementById('errorMsg'),
        presets = document.querySelectorAll('#preset-amounts .preset-btn'),
        cards   = document.querySelectorAll('#category-options .category-card'),
        bzEls   = document.querySelectorAll('.bZkEdm'),
        MIN_C   = 500, MAX_C = 50000;

  function formatBRL(c){ return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(c/100); }
  function getCents(){ const d = amtEl.value.replace(/\D/g,''); return d?parseInt(d,10):0; }

  function validateUI(){
    const c = getCents();
    if(c>=MIN_C && c<=MAX_C){
      btn.removeAttribute('disabled'); errEl.style.display = 'none';
    } else {
      btn.setAttribute('disabled','');
      if(c>0 && c<MIN_C){ errEl.textContent='Mínimo R$ 5,00'; errEl.style.display='block'; }
      else if(c>MAX_C){ errEl.textContent='Máximo R$ 500,00'; errEl.style.display='block'; }
      else errEl.style.display='none';
    }
    if(bzEls.length>=2){
      const disp = (c<MIN_C||c>MAX_C)?0:c;
      bzEls[0].textContent = 'Contribuição: '+formatBRL(disp);
      bzEls[1].textContent = 'Total: '+formatBRL(disp);
    }
  }

  amtEl.addEventListener('input', ()=>{
    const c = getCents();
    amtEl.value = formatBRL(c).replace('R$','').trim();
    presets.forEach(b=>b.classList.remove('ativo'));
    cards.forEach(ca=>ca.classList.remove('ativo'));
    validateUI();
  });
  presets.forEach(b=>b.addEventListener('click', ()=>{
    const c = getCents() + parseInt(b.dataset.value,10)*100;
    amtEl.value = formatBRL(c).replace('R$','').trim();
    presets.forEach(x=>x.classList.remove('ativo')); b.classList.add('ativo');
    validateUI();
  }));
  cards.forEach(ca=>ca.addEventListener('click', ()=>{
    const c = getCents() + parseInt(ca.dataset.value,10)*100;
    amtEl.value = formatBRL(c).replace('R$','').trim();
    cards.forEach(x=>x.classList.remove('ativo')); ca.classList.add('ativo');
    validateUI();
  }));
  validateUI();

  // busca token PIX via nossa function
  async function getPixToken(){
    const res = await fetch('/.netlify/functions/bspay-token');
    if(!res.ok) throw new Error('Não foi possível obter token PIX');
    return (await res.json()).access_token;
  }

  // clique no botão
  btn.addEventListener('click', async ()=>{
    const c = getCents();
    if(c<MIN_C||c>MAX_C) return;
    btn.setAttribute('disabled','');
    btn.textContent = 'Processando…';
    try {
      const token = await getPixToken();
      const payload = {
        amount:        c/100,
        external_id:   'ebook-'+Date.now(),
        payerQuestion:'Ebook',
        postbackUrl:   window.location.origin + '/postback',
        payer: {
          name:     randomName(),
          document: randomCPF(),
          email:    randomEmail()
        }
      };
      const qrRes = await fetch('https://api.bspay.co/v2/pix/qrcode', {
        method:'POST',
        headers:{
          'Authorization': `Bearer ${token}`,
          'Content-Type':  'application/json'
        },
        body: JSON.stringify(payload)
      });
      const qrJson = await qrRes.json();
      if(!qrRes.ok) throw new Error(qrJson.message||'Erro PIX');
      localStorage.setItem('pixQrCodeImage', qrJson.qrcode);
      localStorage.setItem('pixCopyPasteCode', qrJson.transactionId);
      window.location.href = 'pix.html';
    } catch(e) {
      console.error('PIX error:', e);
      alert('Falha ao processar PIX. Tente novamente.');
    } finally {
      btn.removeAttribute('disabled');
      btn.textContent = 'Contribuir';
    }
  });
});
