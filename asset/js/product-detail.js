'use strict';

/*
  product-detail.js
  Tải dữ liệu sản phẩm thật từ /api/products/:id (theo query ?id=) và render vào trang,
  cùng với các hành vi JS thuần cosmetic: tăng/giảm số lượng, bộ lọc đánh giá (chỉ đổi active).
  main.js load trước (defer, cùng trang) nên các hàm/biến top-level của nó (state, api, openModal)
  dùng chung được ở đây.
*/

const CATEGORY_HREF = {
    'Mì ăn liền': 'mi-an-lien.html',
    'Hủ tiếu ăn liền': 'hu-tieu-an-lien.html',
    'Bột ngọt': 'bot-ngot.html',
    'Bột canh': 'bot-canh.html',
    'Trái cây tươi': 'trai-cay-tuoi.html',
    'Nước chấm': 'nuoc-cham.html',
    'Muối chấm': 'muoi-cham.html',
};

let currentProduct = null;

function formatVndPd(amount) {
    if (amount === null || amount === undefined || amount === '') return '';
    return Number(amount).toLocaleString('vi-VN') + 'đ';
}

function renderProduct(product) {
    document.title = `${product.name} - Công ty TNHH Saigon Ve Wong`;

    const categoryLink = document.getElementById('breadcrumb-category');
    if (categoryLink) {
        categoryLink.textContent = product.category || 'Sản phẩm';
        categoryLink.href = CATEGORY_HREF[product.category] || 'index.html';
    }
    const productCrumb = document.getElementById('breadcrumb-product');
    if (productCrumb) productCrumb.textContent = product.name;

    const mainImage = document.getElementById('product-main-image');
    if (mainImage && product.image) {
        const url = `asset/img/products/${product.image}`;
        const probe = new Image();
        probe.onload = () => {
            mainImage.style.backgroundImage = `url(${url})`;
            mainImage.innerHTML = '';
        };
        probe.src = url;
    }

    const brandEl = document.getElementById('product-brand');
    if (brandEl) brandEl.textContent = product.brand || '';

    const titleEl = document.getElementById('product-title');
    if (titleEl) titleEl.textContent = product.name;

    const ratingValue = Number(product.rating || 5);
    const ratingEl = document.getElementById('product-rating-score');
    if (ratingEl) ratingEl.textContent = ratingValue.toFixed(1);

    const starsEl = document.getElementById('product-stars');
    if (starsEl) {
        const filled = Math.max(0, Math.min(5, Math.round(ratingValue)));
        starsEl.innerHTML = Array.from({ length: 5 }, (_, i) =>
            `<i class="${i < filled ? 'product-detail__star--gold' : ''} fa-solid fa-star"></i>`
        ).join('');
    }

    const soldEl = document.getElementById('product-sold');
    if (soldEl) soldEl.textContent = `${product.sold_count || 0} Đã bán`;

    const hasDiscount = product.sale_price != null && product.sale_price !== '' && Number(product.sale_price) < Number(product.price);
    const currentPrice = hasDiscount ? product.sale_price : product.price;

    const priceOldEl = document.getElementById('product-price-old');
    const priceCurrentEl = document.getElementById('product-price-current');
    const priceDiscountEl = document.getElementById('product-price-discount');

    if (priceCurrentEl) priceCurrentEl.textContent = formatVndPd(currentPrice);
    if (priceOldEl) {
        priceOldEl.hidden = !hasDiscount;
        priceOldEl.textContent = hasDiscount ? formatVndPd(product.price) : '';
    }
    if (priceDiscountEl) {
        priceDiscountEl.hidden = !hasDiscount;
        priceDiscountEl.textContent = hasDiscount
            ? `-${Math.round((1 - product.sale_price / product.price) * 100)}%`
            : '';
    }

    const stockQty = Number(product.stock_qty || 0);
    const stockLabel = document.getElementById('product-stock-label');
    if (stockLabel) stockLabel.textContent = stockQty > 0 ? `Còn ${stockQty} sản phẩm` : 'Hết hàng';

    const qtyInput = document.getElementById('product-quantity-input');
    if (qtyInput) {
        qtyInput.value = stockQty > 0 ? '1' : '0';
        qtyInput.disabled = stockQty <= 0;
    }

    const btnCart = document.getElementById('product-btn-cart');
    const btnBuy = document.getElementById('product-btn-buy');
    [btnCart, btnBuy].forEach((btn) => {
        if (!btn) return;
        btn.disabled = stockQty <= 0;
        btn.style.opacity = stockQty <= 0 ? '.5' : '';
        btn.style.pointerEvents = stockQty <= 0 ? 'none' : '';
    });

    const tableEl = document.getElementById('product-description-table');
    if (tableEl) {
        const rows = [
            ['Thương hiệu', product.brand],
            ['Xuất xứ', product.origin],
            ['Danh mục', [product.category, product.subcategory].filter(Boolean).join(' / ')],
        ].filter(([, value]) => value);

        tableEl.innerHTML = rows
            .map(
                ([label, value]) => `
                    <div class="product-description__table-row">
                        <span class="product-description__table-label">${label}</span>
                        <span class="product-description__table-value">${value}</span>
                    </div>`
            )
            .join('');
    }

    const textEl = document.getElementById('product-description-text');
    if (textEl) textEl.textContent = product.description || '';
}

async function loadProduct() {
    const id = new URLSearchParams(location.search).get('id');
    const root = document.querySelector('.product-detail');

    if (!id) {
        if (root) root.innerHTML = '<p style="padding:40px;text-align:center;color:#767676;">Thiếu mã sản phẩm trên đường dẫn.</p>';
        return;
    }

    try {
        const data = await api(`/api/products/${encodeURIComponent(id)}`);
        currentProduct = data.product;
        renderProduct(currentProduct);
    } catch (err) {
        if (root) root.innerHTML = `<p style="padding:40px;text-align:center;color:#767676;">${err.message}</p>`;
    }
}

async function addCurrentProductToCart(quantity) {
    if (!currentProduct) return;
    const hasDiscount = currentProduct.sale_price != null && currentProduct.sale_price !== '' && Number(currentProduct.sale_price) < Number(currentProduct.price);
    const price = formatVndPd(hasDiscount ? currentProduct.sale_price : currentProduct.price);
    const image = currentProduct.image ? `asset/img/products/${currentProduct.image}` : '';

    return api('/api/cart', {
        method: 'POST',
        body: JSON.stringify({
            productId: currentProduct.id,
            name: currentProduct.name,
            image,
            price,
            qty: quantity,
        }),
    });
}

function currentQuantity() {
    const qtyInput = document.getElementById('product-quantity-input');
    return Math.max(1, parseInt(qtyInput?.value, 10) || 1);
}

document.getElementById('product-btn-cart')?.addEventListener('click', async () => {
    if (!state.user) {
        openModal('login');
        return;
    }
    try {
        const data = await addCurrentProductToCart(currentQuantity());
        renderCart(data.items);
    } catch (err) {
        alert(err.message);
    }
});

document.getElementById('product-btn-buy')?.addEventListener('click', async () => {
    if (!state.user) {
        openModal('login');
        return;
    }
    try {
        const data = await addCurrentProductToCart(currentQuantity());
        renderCart(data.items);
        location.href = 'index.html';
    } catch (err) {
        alert(err.message);
    }
});

// Tăng / giảm số lượng
const quantityInput = document.getElementById('product-quantity-input');
const decreaseBtn = document.getElementById('product-quantity-decrease');
const increaseBtn = document.getElementById('product-quantity-increase');

function clampQuantity(value) {
    const max = currentProduct ? Number(currentProduct.stock_qty || 0) : 99;
    if (Number.isNaN(value) || value < 1) return 1;
    if (value > max) return max;
    return value;
}

if (decreaseBtn && increaseBtn && quantityInput) {
    decreaseBtn.addEventListener('click', () => {
        quantityInput.value = clampQuantity(parseInt(quantityInput.value, 10) - 1);
    });

    increaseBtn.addEventListener('click', () => {
        quantityInput.value = clampQuantity(parseInt(quantityInput.value, 10) + 1);
    });

    quantityInput.addEventListener('change', () => {
        quantityInput.value = clampQuantity(parseInt(quantityInput.value, 10));
    });
}

// Bộ lọc đánh giá - chỉ đổi trạng thái active (cosmetic)
const reviewFilters = document.querySelectorAll('.js-review-filter');

reviewFilters.forEach((filter) => {
    filter.addEventListener('click', () => {
        reviewFilters.forEach((item) => item.classList.remove('product-reviews__filter--active'));
        filter.classList.add('product-reviews__filter--active');
    });
});

loadProduct();
