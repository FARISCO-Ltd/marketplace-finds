const productsGrid = document.getElementById('products-grid');
const year = document.getElementById('year');
const languageToggle = document.getElementById('language-toggle');
const menuToggle = document.getElementById('menu-toggle');
const siteNav = document.querySelector('.site-nav');
const database = window.supabase.createClient(
  window.SUPABASE_CONFIG.url,
  window.SUPABASE_CONFIG.publishableKey
);

const copy = {
  en: {
    navHome: 'Home', navProducts: 'Products', heroEyebrow: 'Curated product discoveries',
    heroTitle: 'Find the things<br><span>worth finding.</span>',
    heroCopy: 'A considered collection of useful, trending products from Amazon to TikTok—picked to make everyday life a little better.',
    heroButton: 'Explore the latest finds', productsEyebrow: 'Fresh discoveries', productsTitle: 'Latest finds',
    productsCopy: 'Products that earned a place on our shortlist.', loading: 'Loading products…',
    featured: 'Featured find', amazon: 'Amazon', tiktok: 'TikTok', unavailable: 'Products are unavailable right now. Please check back soon.',
    empty: 'New finds are coming soon.', followTikTok: 'Follow us on TikTok', copyright: 'Marketplace Finds. All rights reserved.'
  },
  ar: {
    navHome: 'الرئيسية', navProducts: 'المنتجات', heroEyebrow: 'منتجات مختارة بعناية',
    heroTitle: 'اكتشف منتجات<br><span>تستحق الاقتناء.</span>',
    heroCopy: 'مجموعة منتقاة من المنتجات المفيدة والرائجة من أمازون وTikTok، لتجعل حياتك اليومية أفضل قليلًا.',
    heroButton: 'استكشف أحدث المنتجات', productsEyebrow: 'اكتشافات جديدة', productsTitle: 'أحدث المنتجات',
    productsCopy: 'منتجات اخترناها لتكون ضمن قائمتنا المفضلة.', loading: 'جارٍ تحميل المنتجات…',
    featured: 'منتج مميز', amazon: 'أمازون', tiktok: 'تيك توك', unavailable: 'المنتجات غير متاحة الآن. يرجى المحاولة لاحقًا.',
    empty: 'منتجات جديدة قريبًا.', followTikTok: 'تابعنا على تيك توك', copyright: 'Marketplace Finds. جميع الحقوق محفوظة.'
  }
};

let currentLanguage = localStorage.getItem('marketplace-language') || 'en';
let products = [];

year.textContent = new Date().getFullYear();

function stars(rating) {
  return '★'.repeat(Math.max(0, Math.min(5, Number(rating) || 0)));
}

function productCard(product) {
  const text = copy[currentLanguage];
  const title = currentLanguage === 'ar' && product.title_ar ? product.title_ar : (product.title || 'Marketplace Find');
  const price = product.price || (currentLanguage === 'ar' ? 'اعرف السعر' : 'See price');
  const amazon = product.amazon_url || product.amazon || '#';
  const tiktok = product.tiktok_url || product.tiktok || '#';
  const image = product.image_url || product.image;

  return `
    <article class="product-card">
      <div class="product-image"><img src="${image}" alt="${title}" loading="lazy"></div>
      <div class="product-details">
        <div class="product-meta"><span>${text.featured}</span><span class="rating" aria-label="${product.rating || 0} out of 5 stars">${stars(product.rating)}</span></div>
        <h3>${title}</h3>
        <div class="product-bottom">
          <span class="price">${price}</span>
          <div class="product-links">
            <a href="${amazon}" target="_blank" rel="noopener noreferrer">${text.amazon}</a>
            <a href="${tiktok}" target="_blank" rel="noopener noreferrer">${text.tiktok}</a>
          </div>
        </div>
      </div>
    </article>`;
}

function renderProducts() {
  const text = copy[currentLanguage];
  productsGrid.innerHTML = products.length ? products.map(productCard).join('') : `<p class="empty-state">${text.empty}</p>`;
}

function setLanguage(language) {
  currentLanguage = language;
  const text = copy[language];
  document.documentElement.lang = language;
  document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach((element) => { element.innerHTML = text[element.dataset.i18n]; });
  languageToggle.textContent = language === 'ar' ? 'English' : 'العربية';
  languageToggle.setAttribute('aria-label', language === 'ar' ? 'Switch to English' : 'Switch to Arabic');
  localStorage.setItem('marketplace-language', language);
  renderProducts();
}

languageToggle.addEventListener('click', () => setLanguage(currentLanguage === 'en' ? 'ar' : 'en'));

menuToggle.addEventListener('click', () => {
  const open = siteNav.classList.toggle('is-open');
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
});

siteNav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    siteNav.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open menu');
  });
});

async function loadProducts() {
  const { data, error } = await database
    .from('products')
    .select('*')
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (!error && data.length) {
    products = data;
  } else {
    try {
      const response = await fetch('products.json?v=10');
      if (!response.ok) throw new Error('Could not load products.');
      products = await response.json();
    } catch (fallbackError) {
      productsGrid.innerHTML = `<p class="empty-state">${copy[currentLanguage].unavailable}</p>`;
      return;
    }
  }
  setLanguage(currentLanguage);
}

loadProducts();
