'use strict';

/* ====== CONFIGURAÇÃO ======
   Os formulários precisam de um serviço que receba os dados e envie para você.
   1) Crie uma conta gratuita em https://formspree.io
   2) Crie dois formulários (reservas e vagas) e cole os endereços abaixo.
*/
const ENDPOINTS = {
  reserva: 'https://formspree.io/f/SEU_ID_RESERVAS',
  vaga: 'https://formspree.io/f/SEU_ID_VAGAS'
};

/* Promoções da semana: edite os textos. Índice 0 = domingo. */
const PROMOS = [
  { dia: 'Domingo', txt: 'Fechado. Voltamos segunda.' },
  { dia: 'Segunda', txt: 'Edite aqui a promoção de segunda.' },
  { dia: 'Terça', txt: 'Edite aqui a promoção de terça.' },
  { dia: 'Quarta', txt: 'Edite aqui a promoção de quarta.' },
  { dia: 'Quinta', txt: 'Edite aqui a promoção de quinta.' },
  { dia: 'Sexta', txt: 'Edite aqui a promoção de sexta.' },
  { dia: 'Sábado', txt: 'Edite aqui a promoção de sábado.' }
];

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const store = {
  get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, v); } catch {} }
};

/* topo e menu móvel */
const header = $('#top'), nav = $('#nav'), burger = $('#burger');
addEventListener('scroll', () => header.classList.toggle('solid', scrollY > 40), { passive: true });
burger.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  burger.setAttribute('aria-expanded', open);
});
$$('a', nav).forEach(a => a.addEventListener('click', () => {
  nav.classList.remove('open');
  burger.setAttribute('aria-expanded', 'false');
}));

/* carrossel */
const track = $('#track');
const step = () => (track.firstElementChild?.getBoundingClientRect().width || 300) + 16;
$('#prev').addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
$('#next').addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
let auto = setInterval(advance, 5000);
function advance() {
  const end = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
  track.scrollTo({ left: end ? 0 : track.scrollLeft + step(), behavior: 'smooth' });
}
['pointerdown', 'mouseenter', 'focusin'].forEach(e => track.parentElement.addEventListener(e, () => clearInterval(auto)));

/* abas do cardápio */
const tabs = $$('[role=tab]');
function selectTab(t) {
  tabs.forEach(b => {
    const on = b === t;
    b.setAttribute('aria-selected', on);
    b.tabIndex = on ? 0 : -1;
    $('#' + b.getAttribute('aria-controls')).hidden = !on;
  });
  t.focus();
}
tabs.forEach((t, i) => {
  t.addEventListener('click', () => selectTab(t));
  t.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') selectTab(tabs[(i + 1) % tabs.length]);
    if (e.key === 'ArrowLeft') selectTab(tabs[(i + tabs.length - 1) % tabs.length]);
  });
});

/* promoções: destaca o dia de hoje (textos inseridos com textContent) */
const promos = $('#promos'), hoje = new Date().getDay();
PROMOS.forEach((p, i) => {
  const d = document.createElement('div');
  d.className = 'promo' + (i === hoje ? ' today' : '');
  const h = document.createElement('h3'); h.textContent = p.dia + (i === hoje ? ' (hoje)' : '');
  const t = document.createElement('p'); t.textContent = p.txt;
  d.append(h, t);
  promos.append(d);
});

/* formulários */
const loadedAt = Date.now();
$$('form[data-kind]').forEach(form => {
  const status = $('.status', form);
  const say = (m, c) => { status.textContent = m; status.className = 'status ' + c; };

  if (form.dataset.kind === 'reserva') $('[name=data]', form).min = new Date().toISOString().slice(0, 10);

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if ($('[name=_gotcha]', form).value) return;            // robô preencheu o campo oculto
    if (Date.now() - loadedAt < 3000) return say('Aguarde um instante e envie novamente.', 'err');

    let ok = true;
    $$('input,select,textarea', form).forEach(f => {
      const bad = !f.checkValidity();
      f.setAttribute('aria-invalid', bad);
      if (bad) ok = false;
    });
    const tel = $('[name=telefone]', form).value.replace(/\D/g, '');
    if (tel.length < 10 || tel.length > 13) { ok = false; $('[name=telefone]', form).setAttribute('aria-invalid', 'true'); }
    if (!ok) return say('Confira os campos destacados.', 'err');

    const btn = $('button[type=submit]', form);
    btn.disabled = true; say('Enviando...', '');
    try {
      const res = await fetch(ENDPOINTS[form.dataset.kind], {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form)
      });
      if (!res.ok) throw new Error();
      form.reset();
      say(form.dataset.kind === 'reserva'
        ? 'Solicitação enviada. Entraremos em contato em breve.'
        : 'Cadastro enviado com sigilo. Entraremos em contato.', 'ok');
    } catch {
      say('Não foi possível enviar agora. Tente de novo ou fale pelo WhatsApp.', 'err');
    } finally { btn.disabled = false; }
  });
});

$('#y').textContent = new Date().getFullYear();
