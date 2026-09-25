import { loadFirebaseClient } from './cloud-sync.js';

const slot = document.querySelector('[data-account-root]');
if (slot) {
  const dialog = document.createElement('dialog');
  dialog.className = 'account-dialog';
  dialog.setAttribute('aria-labelledby', 'account-title');
  dialog.innerHTML = `
    <button class="account-close" type="button" aria-label="Pencereyi kapat">×</button>
    <div class="account-content"></div>`;
  document.body.append(dialog);

  const button = document.createElement('button');
  button.className = 'account-button';
  button.type = 'button';
  button.textContent = 'Giriş yap';
  let platformFirebase = null;
  let unavailable = false;
  button.addEventListener('click', () => {
    if (unavailable) renderUnavailable();
    else renderDialog(platformFirebase?.auth.currentUser || null);
  });
  slot.append(button);

  const content = dialog.querySelector('.account-content');
  dialog.querySelector('.account-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });

  let mode = 'signin';
  function renderDialog(user = null, error = '') {
    if (user) {
      content.innerHTML = `<p class="account-eyebrow">OYUN ARASI HESABI</p><h2 id="account-title">Merhaba${user.displayName ? `, ${escapeHtml(user.displayName)}` : ''}</h2><p class="account-copy">Oyun ilerlemen hesabında saklanıyor.</p><p class="account-email">${escapeHtml(user.email || '')}</p><button class="account-submit" id="account-signout" type="button">Çıkış yap</button>`;
      content.querySelector('#account-signout').addEventListener('click', async () => {
        try { await platformFirebase.signOut(); dialog.close(); }
        catch { renderDialog(user, 'Çıkış yapılamadı. Tekrar dene.'); }
      });
    } else {
      const signup = mode === 'signup';
      content.innerHTML = `<p class="account-eyebrow">OYUN ARASI HESABI</p><h2 id="account-title">${signup ? 'Hesap oluştur' : 'Giriş yap'}</h2><p class="account-copy">${signup ? 'İlerlemeni cihazların arasında eşitle.' : 'Oyunlarına kaldığın yerden devam et.'}</p><form class="account-form" id="account-form">${signup ? '<label>Görünen ad<input name="displayName" type="text" maxlength="30" autocomplete="name" required></label>' : ''}<label>E-posta<input name="email" type="email" autocomplete="email" required></label><label>Şifre<input name="password" type="password" minlength="6" autocomplete="${signup ? 'new-password' : 'current-password'}" required></label><button class="account-submit" type="submit">${signup ? 'Kayıt ol' : 'Giriş yap'}</button></form><p class="account-error" role="status">${escapeHtml(error)}</p><button class="account-switch" type="button">${signup ? 'Hesabın var mı? Giriş yap' : 'Hesabın yok mu? Kayıt ol'}</button>`;
      content.querySelector('.account-switch').addEventListener('click', () => { mode = signup ? 'signin' : 'signup'; renderDialog(); });
      content.querySelector('#account-form').addEventListener('submit', async event => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const submit = content.querySelector('.account-submit');
        submit.disabled = true;
        try {
          platformFirebase ||= (await loadFirebaseClient()).platformFirebase;
          if (signup) await platformFirebase.signUp(form.get('email').trim(), form.get('password'), form.get('displayName').trim());
          else await platformFirebase.signIn(form.get('email').trim(), form.get('password'));
          dialog.close();
        } catch (authError) {
          submit.disabled = false;
          renderDialog(null, authErrorMessage(authError));
        }
      });
    }
    if (!dialog.open) dialog.showModal();
  }

  function renderUnavailable() {
    content.innerHTML = `<p class="account-eyebrow">OYUN ARASI HESABI</p><h2 id="account-title">Hesap servisine ulaşılamıyor</h2><p class="account-copy">Oyunlar bu cihazda kaydolmaya devam ediyor. Reklam engelleyiciyi kapatıp ya da bağlantını kontrol edip sayfayı yenileyerek tekrar deneyebilirsin.</p>`;
    if (!dialog.open) dialog.showModal();
  }

  loadFirebaseClient()
    .then(client => {
      platformFirebase = client.platformFirebase;
      platformFirebase.onAuthStateChanged(user => {
        button.textContent = user ? (user.displayName || 'Hesabım') : 'Giriş yap';
        button.setAttribute('aria-label', user ? `Hesap: ${user.displayName || user.email}` : 'Giriş yap veya hesap oluştur');
        window.dispatchEvent(new CustomEvent('oyunarasi-auth-changed', { detail: { user } }));
        if (dialog.open) renderDialog(user);
      });
    })
    .catch(() => {
      unavailable = true;
      if (dialog.open) renderUnavailable();
    });
}

function authErrorMessage(error) {
  const messages = {
    'auth/email-already-in-use': 'Bu e-posta adresiyle hesap zaten var.',
    'auth/invalid-credential': 'E-posta veya şifre hatalı.',
    'auth/invalid-email': 'Geçerli bir e-posta adresi yaz.',
    'auth/weak-password': 'Şifre en az 6 karakter olmalı.',
    'auth/network-request-failed': 'İnternet bağlantını kontrol et.'
  };
  return messages[error?.code] || 'İşlem tamamlanamadı. Biraz sonra tekrar dene.';
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}
