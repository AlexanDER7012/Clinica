function getContenedor() {
  let c = document.getElementById('toast-contenedor');
  if (!c) {
    c = document.createElement('div');
    c.id = 'toast-contenedor';
    c.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
    document.body.appendChild(c);
  }
  return c;
}

const TIPOS = {
  exito:    { bg: '#f0fff4', border: '#9ae6b4', color: '#22543d', icono: '✅' },
  error:    { bg: '#fff5f5', border: '#fc8181', color: '#822727', icono: '❌' },
  info:     { bg: '#ebf8ff', border: '#90cdf4', color: '#2b6cb0', icono: 'ℹ️'  },
  alerta:   { bg: '#fefcbf', border: '#f6e05e', color: '#744210', icono: '⚠️' },
};

export function toast(mensaje, tipo = 'exito', duracion = 3500) {
  const c   = getContenedor();
  const cfg = TIPOS[tipo] || TIPOS.info;

  const t = document.createElement('div');
  t.style.cssText = `
    background: ${cfg.bg};
    border: 1.5px solid ${cfg.border};
    color: ${cfg.color};
    border-radius: 10px;
    padding: 12px 16px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.88rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 260px;
    max-width: 360px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    pointer-events: all;
    opacity: 0;
    transform: translateX(40px);
    transition: opacity 0.25s ease, transform 0.25s ease;
  `;

  t.innerHTML = `
    <span style="font-size:1.1rem; flex-shrink:0;">${cfg.icono}</span>
    <span style="flex:1; line-height:1.4;">${mensaje}</span>
    <button onclick="this.parentElement.remove()"
      style="background:none;border:none;color:${cfg.color};cursor:pointer;
             font-size:1rem;padding:0;opacity:0.6;flex-shrink:0;line-height:1;">✕</button>
  `;

  c.appendChild(t);

  // Animación entrada
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      t.style.opacity   = '1';
      t.style.transform = 'translateX(0)';
    });
  });

  // Auto cerrar
  setTimeout(() => {
    t.style.opacity   = '0';
    t.style.transform = 'translateX(40px)';
    setTimeout(() => t.remove(), 280);
  }, duracion);
}

// Atajos
export const toastExito  = (msg) => toast(msg, 'exito');
export const toastError  = (msg) => toast(msg, 'error');
export const toastAlerta = (msg) => toast(msg, 'alerta');
export const toastInfo   = (msg) => toast(msg, 'info');