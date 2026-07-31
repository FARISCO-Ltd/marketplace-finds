const resetDatabase = window.supabase.createClient(
  window.SUPABASE_CONFIG.url,
  window.SUPABASE_CONFIG.publishableKey
);
const resetForm = document.getElementById('reset-form');
const resetMessage = document.getElementById('reset-message');

resetForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const password = document.getElementById('new-password').value;
  const confirmation = document.getElementById('confirm-password').value;
  resetMessage.textContent = '';

  if (password !== confirmation) {
    resetMessage.textContent = 'The passwords do not match.';
    return;
  }

  const { error } = await resetDatabase.auth.updateUser({ password });
  if (error) {
    resetMessage.textContent = 'This reset link has expired. Return to the admin page and request a new one.';
    return;
  }

  resetMessage.style.color = '#ffbd56';
  resetMessage.textContent = 'Password updated. Redirecting to sign in…';
  setTimeout(() => { window.location.href = 'admin.html'; }, 1300);
});
