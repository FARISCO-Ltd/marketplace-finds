const adminDatabase = window.supabase.createClient(
  window.SUPABASE_CONFIG.url,
  window.SUPABASE_CONFIG.publishableKey
);

const loginPanel = document.getElementById('login-panel');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');
const productForm = document.getElementById('product-form');
const productMessage = document.getElementById('product-message');
const publishButton = document.getElementById('publish-button');
const productsList = document.getElementById('admin-products');
const productCount = document.getElementById('product-count');
const forgotPasswordButton = document.getElementById('forgot-password');
let authenticatedInThisPage = false;

function showDashboard() {
  loginPanel.hidden = true;
  dashboard.hidden = false;
  loadAdminProducts();
}

function showLogin() {
  dashboard.hidden = true;
  loginPanel.hidden = false;
}

function safeFileName(fileName) {
  return fileName.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '');
}

async function loadAdminProducts() {
  const { data, error } = await adminDatabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    productsList.innerHTML = '<p class="form-message">Could not load products. Please refresh the page.</p>';
    return;
  }

  productCount.textContent = `${data.length} ${data.length === 1 ? 'product' : 'products'}`;
  productsList.innerHTML = data.length ? data.map((product) => `
    <article class="admin-product">
      <img src="${product.image_url}" alt="${product.title}">
      <div class="admin-product-info"><strong>${product.title}</strong><span>${product.price}${product.is_published ? ' · Published' : ' · Draft'}</span></div>
      <button class="delete-button" type="button" data-id="${product.id}" data-image="${product.image_url}">Delete</button>
    </article>`).join('') : '<p class="muted">Your first product will appear here.</p>';
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginMessage.textContent = '';
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const { error } = await adminDatabase.auth.signInWithPassword({ email, password });
  if (error) {
    loginMessage.textContent = 'The email or password is incorrect.';
    return;
  }
  authenticatedInThisPage = true;
  loginForm.reset();
  // Reload once after a successful sign-in. This makes the stored session the
  // single source of truth and avoids a delayed initial check returning users
  // to the sign-in form.
  window.location.replace('admin.html?dashboard=1');
});

forgotPasswordButton.addEventListener('click', async () => {
  const email = document.getElementById('login-email').value.trim();
  if (!email) {
    loginMessage.textContent = 'Enter your email first, then select Forgot password.';
    return;
  }
  loginMessage.textContent = 'Sending reset link…';
  const { error } = await adminDatabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://farisco-ltd.github.io/marketplace-finds/reset-password.html'
  });
  loginMessage.textContent = error ? 'Could not send a reset link. Please try again.' : 'Reset link sent. Check your email.';
});

productForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  productMessage.textContent = '';
  const image = document.getElementById('image').files[0];
  if (!image) {
    productMessage.textContent = 'Please choose a product image.';
    return;
  }

  publishButton.disabled = true;
  publishButton.textContent = 'Publishing…';
  const imagePath = `${Date.now()}-${safeFileName(image.name)}`;
  const { error: uploadError } = await adminDatabase.storage
    .from('product-images')
    .upload(imagePath, image, { cacheControl: '3600', upsert: false });

  if (uploadError) {
    productMessage.textContent = `Image upload failed: ${uploadError.message}`;
    publishButton.disabled = false;
    publishButton.textContent = 'Publish product';
    return;
  }

  const { data: publicImage } = adminDatabase.storage.from('product-images').getPublicUrl(imagePath);
  const { error: insertError } = await adminDatabase.from('products').insert({
    title: document.getElementById('title').value.trim(),
    title_ar: document.getElementById('title-ar').value.trim() || null,
    price: document.getElementById('price').value.trim(),
    rating: Number(document.getElementById('rating').value),
    image_url: publicImage.publicUrl,
    amazon_url: document.getElementById('amazon-url').value.trim(),
    tiktok_url: document.getElementById('tiktok-url').value.trim(),
    is_published: document.getElementById('published').checked
  });

  if (insertError) {
    productMessage.textContent = `Product could not be saved: ${insertError.message}`;
    await adminDatabase.storage.from('product-images').remove([imagePath]);
  } else {
    productForm.reset();
    document.getElementById('published').checked = true;
    productMessage.style.color = '#257449';
    productMessage.textContent = 'Product published successfully.';
    await loadAdminProducts();
  }
  publishButton.disabled = false;
  publishButton.textContent = 'Publish product';
});

productsList.addEventListener('click', async (event) => {
  const button = event.target.closest('.delete-button');
  if (!button || !confirm('Delete this product?')) return;
  const productId = button.dataset.id;
  const imageUrl = button.dataset.image;
  button.disabled = true;

  const { error } = await adminDatabase.from('products').delete().eq('id', productId);
  if (error) {
    productMessage.textContent = `Could not delete product: ${error.message}`;
    button.disabled = false;
    return;
  }
  const imagePath = imageUrl.split('/product-images/')[1];
  if (imagePath) await adminDatabase.storage.from('product-images').remove([imagePath]);
  await loadAdminProducts();
});

document.getElementById('sign-out').addEventListener('click', async () => {
  await adminDatabase.auth.signOut();
  showLogin();
});

adminDatabase.auth.onAuthStateChange((_event, session) => {
  if (session) {
    authenticatedInThisPage = true;
    showDashboard();
  } else if (!authenticatedInThisPage) {
    showLogin();
  }
});

adminDatabase.auth.getSession().then(({ data: { session } }) => {
  // Do not let a slow first check overwrite a sign-in that just succeeded.
  if (authenticatedInThisPage) return;
  if (session) showDashboard();
  else showLogin();
});
