const resetDatabase = window.supabase.createClient(
  window.SUPABASE_CONFIG.url,
  window.SUPABASE_CONFIG.publishableKey,
  { auth: { detectSessionInUrl: false, flowType: 'pkce' } }
);
const resetForm = document.getElementById('reset-form');
const resetMessage = document.getElementById('reset-message');
let recoveryReady = false;

async function prepareRecoverySession() {
  const query = new URLSearchParams(window.location.search);
  const fragment = new URLSearchParams(window.location.hash.slice(1));
  if (query.get('code')) {
    const { error } = await resetDatabase.auth.exchangeCodeForSession(query.get('code'));
    if (error) {
      resetMessage.textContent = 'This reset link is invalid or has already been used. Request one new link and open it only once.';
      return;
    }
    window.history.replaceState({}, document.title, window.location.pathname);
  } else if (fragment.get('access_token') && fragment.get('refresh_token')) {
    const { error } = await resetDatabase.auth.setSession({
      access_token: fragment.get('access_token'),
      refresh_token: fragment.get('refresh_token')
    });
    if (error) {
      resetMessage.textContent = 'This reset link is invalid or has already been used. Request one new link and open it only once.';
      return;
    }
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  const { data: { session } } = await resetDatabase.auth.getSession();
  recoveryReady = Boolean(session);
  if (!recoveryReady) {
    resetMessage.textContent = 'This reset link is not active yet. Open the newest link from your email in this same browser.';
  }
}

prepareRecoverySession();

resetForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const password = document.getElementById('new-password').value;
  const confirmation = document.getElementById('confirm-password').value;
  resetMessage.textContent = '';

  if (password !== confirmation) {
    resetMessage.textContent = 'The passwords do not match.';
    return;
  }

  if (!recoveryReady) {
    resetMessage.textContent = 'This reset link is invalid or has expired. Request one new link, then open the newest email link only once.';
    return;
  }

  const { error } = await resetDatabase.auth.updateUser({ password });
  if (error) {
    resetMessage.textContent = `Password could not be updated: ${error.message}`;
    return;
  }

  resetMessage.style.color = '#ffbd56';
  resetMessage.textContent = 'Password updated. Redirecting to sign in…';
  setTimeout(() => { window.location.href = 'admin.html'; }, 1300);
});
