const productsGrid = document.getElementById('products-grid');
const year = document.getElementById('year');

year.textContent = new Date().getFullYear();

function stars(rating) {
  return '★'.repeat(Math.max(0, Math.min(5, Number(rating) || 0)));
}

function productCard(product) {
  const title = product.title || 'Marketplace Find';
  const price = product.price || 'See price';
  const amazon = product.amazon || '#';
  const tiktok = product.tiktok || '#';

  return `
    <article class="product-card">
      <div class="product-image">
        <img src="${product.image}" alt="${title}" loading="lazy">
      </div>
      <div class="product-details">
        <div class="product-meta">
          <span>Featured find</span>
          <span class="rating" aria-label="${product.rating || 0} out of 5 stars">${stars(product.rating)}</span>
        </div>
        <h3>${title}</h3>
        <div class="product-bottom">
          <span class="price">${price}</span>
          <div class="product-links">
            <a href="${amazon}" target="_blank" rel="noopener noreferrer">Amazon</a>
            <a href="${tiktok}" target="_blank" rel="noopener noreferrer">TikTok</a>
          </div>
        </div>
      </div>
    </article>`;
}

async function loadProducts() {
  try {
    const response = await fetch('products.json');
    if (!response.ok) throw new Error('Could not load products.');
    const products = await response.json();
    productsGrid.innerHTML = products.length
      ? products.map(productCard).join('')
      : '<p class="empty-state">New finds are coming soon.</p>';
  } catch (error) {
    productsGrid.innerHTML = '<p class="empty-state">Products are unavailable right now. Please check back soon.</p>';
  }
}

loadProducts();
