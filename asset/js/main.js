'use strict';

function $(selector, parent = document) {
    return parent.querySelector(selector);
}

function $$(selector, parent = document) {
    return Array.from(parent.querySelectorAll(selector));
}

function setActive(list, target, activeClass) {
    list.forEach((item) => item.classList.remove(activeClass));
    target.classList.add(activeClass);
}

async function api(url, options = {}) {
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra, vui lòng thử lại');
    }
    return data;
}

const state = { user: null };

// Modal đăng nhập / đăng ký
const modal = $('#modal');

function showAuthForm(mode) {
    $$('.auth-form', modal).forEach((form) => {
        form.hidden = form.dataset.authForm !== mode;
    });
    $$('.auth-form__error', modal).forEach((el) => {
        el.hidden = true;
        el.textContent = '';
    });
}

function openModal(mode) {
    showAuthForm(mode);
    modal.hidden = false;
}

function closeModal() {
    modal.hidden = true;
}

function showAuthError(mode, message) {
    const error = $(`[data-auth-form="${mode}"] .auth-form__error`, modal);
    error.textContent = message;
    error.hidden = false;
}

// Trạng thái đăng nhập trên navbar
function setAuthState(user) {
    state.user = user;
    const userBlocks = $$('.js-navbar-user');
    const userNames = $$('.js-navbar-user-name');
    const guestActions = $$('.js-open-modal');

    if (user) {
        userBlocks.forEach((el) => { el.hidden = false; });
        userNames.forEach((el) => { el.textContent = user.name; });
        guestActions.forEach((el) => { el.hidden = true; });
    } else {
        userBlocks.forEach((el) => { el.hidden = true; });
        userNames.forEach((el) => { el.textContent = ''; });
        guestActions.forEach((el) => { el.hidden = false; });
    }
}

// Giỏ hàng
function renderCartItem(item) {
    const li = document.createElement('li');
    li.className = 'header__cart-item';
    li.dataset.productId = item.productId;

    const img = document.createElement('img');
    img.src = item.image || '';
    img.alt = 'hinh sp';
    img.className = 'header__cart-img';

    const info = document.createElement('div');
    info.className = 'header__cart-item-info';

    const head = document.createElement('div');
    head.className = 'header__cart-item-head';

    const name = document.createElement('h5');
    name.className = 'header__cart-item-name';
    name.textContent = item.name;

    const priceWrap = document.createElement('div');
    priceWrap.className = 'header__cart-item-price-wrap';

    const price = document.createElement('span');
    price.className = 'header__cart-item-price';
    price.textContent = item.price;

    const multiply = document.createElement('span');
    multiply.className = 'header__cart-item-mltiply';
    multiply.textContent = 'x';

    const qty = document.createElement('span');
    qty.className = 'header__cart-item-qnt';
    qty.textContent = String(item.qty);

    priceWrap.append(price, multiply, qty);
    head.append(name, priceWrap);

    const body = document.createElement('div');
    body.className = 'header__cart-item-body';

    const remove = document.createElement('span');
    remove.className = 'header__cart-item-remove';
    remove.textContent = 'Xóa';

    body.append(remove);
    info.append(head, body);
    li.append(img, info);
    return li;
}

function renderCart(items) {
    const list = $('#cart-list-item');
    list.innerHTML = '';
    items.forEach((item) => list.appendChild(renderCartItem(item)));

    const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
    $('.header__cart-notice').textContent = String(totalQty);
    $('#cart-list').classList.toggle('header__cart-list--no-cart', items.length === 0);
}

async function refreshCart() {
    if (!state.user) {
        renderCart([]);
        return;
    }
    const data = await api('/api/cart');
    renderCart(data.items);
}

function extractImageUrl(el) {
    const bg = el.style.backgroundImage || '';
    const match = bg.match(/url\((['"]?)(.*?)\1\)/);
    return match ? match[2] : '';
}

async function addToCart(card) {
    const productId = card.dataset.productId;
    const name = $('.home-product-item__name', card).textContent.trim();
    const price = $('.home-product-item__price-current', card).textContent.trim();
    const image = extractImageUrl($('.home-product-item__img', card));

    const data = await api('/api/cart', {
        method: 'POST',
        body: JSON.stringify({ productId, name, image, price }),
    });
    renderCart(data.items);
}

async function removeFromCart(productId) {
    const data = await api(`/api/cart/${encodeURIComponent(productId)}`, { method: 'DELETE' });
    renderCart(data.items);
}

// Khởi tạo trạng thái đăng nhập + giỏ hàng khi tải trang
async function initSession() {
    try {
        const { user } = await api('/api/auth/me');
        setAuthState(user);
        await refreshCart();
    } catch (err) {
        setAuthState(null);
    }
}

// ===== Auth modal wiring =====
(function initAuthModal() {
    $$('.js-open-modal').forEach((trigger) => {
        trigger.addEventListener('click', () => openModal(trigger.dataset.authMode));
        trigger.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openModal(trigger.dataset.authMode);
            }
        });
    });

    $$('[data-modal-close]', modal).forEach((el) => {
        el.addEventListener('click', closeModal);
    });

    $$('[data-auth-switch]', modal).forEach((el) => {
        el.addEventListener('click', () => showAuthForm(el.dataset.authSwitch));
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.hidden) closeModal();
    });

    $('#register-submit').addEventListener('click', async () => {
        const email = $('#register-email').value.trim();
        const password = $('#register-password').value;
        const passwordConfirm = $('#register-password-confirm').value;

        if (!email || !password) {
            return showAuthError('register', 'Vui lòng nhập email và mật khẩu');
        }
        if (password !== passwordConfirm) {
            return showAuthError('register', 'Mật khẩu nhập lại không khớp');
        }

        try {
            const { user } = await api('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });
            setAuthState(user);
            await refreshCart();
            closeModal();
        } catch (err) {
            showAuthError('register', err.message);
        }
    });

    $('#login-submit').addEventListener('click', async () => {
        const email = $('#login-email').value.trim();
        const password = $('#login-password').value;

        if (!email || !password) {
            return showAuthError('login', 'Vui lòng nhập email và mật khẩu');
        }

        try {
            const { user } = await api('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });
            setAuthState(user);
            await refreshCart();
            closeModal();
        } catch (err) {
            showAuthError('login', err.message);
        }
    });

    $$('.auth-form__input', modal).forEach((input) => {
        input.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter') return;
            const mode = input.closest('.auth-form').dataset.authForm;
            $(`#${mode}-submit`).click();
        });
    });

    $$('.js-logout').forEach((el) => {
        el.addEventListener('click', async (e) => {
            e.preventDefault();
            await api('/api/auth/logout', { method: 'POST' });
            setAuthState(null);
            renderCart([]);
        });
    });
})();

// ===== Menu tài khoản trên mobile/tablet =====
(function initMobileAccountMenu() {
    $$('.js-mobile-account-toggle').forEach((toggle) => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            $('.js-mobile-account-menu', toggle.parentElement).classList.toggle('header__mobile-account-user-menu--open');
        });
    });

    document.addEventListener('click', (e) => {
        $$('.header__mobile-account-user-menu--open').forEach((menu) => {
            if (!menu.contains(e.target) && !menu.previousElementSibling.contains(e.target)) {
                menu.classList.remove('header__mobile-account-user-menu--open');
            }
        });
    });
})();

// ===== Giỏ hàng =====
// Dùng event delegation trên document (thay vì gắn trực tiếp vào từng nút) vì các
// thẻ sản phẩm trong .home-product-item__add-cart giờ được render động từ API sau
// khi trang đã tải xong, nên không thể querySelectorAll một lần lúc khởi tạo.
(function initCart() {
    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('.home-product-item__add-cart');
        if (!btn) return;

        e.preventDefault();
        e.stopPropagation();

        if (!state.user) {
            openModal('login');
            return;
        }
        try {
            await addToCart(btn.closest('.home-product-item'));
        } catch (err) {
            alert(err.message);
        }
    });

    $('#cart-list-item').addEventListener('click', async (e) => {
        const removeBtn = e.target.closest('.header__cart-item-remove');
        if (!removeBtn) return;

        const item = removeBtn.closest('.header__cart-item');
        try {
            await removeFromCart(item.dataset.productId);
        } catch (err) {
            alert(err.message);
        }
    });
})();

// ===== Yêu thích sản phẩm =====
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.home-product-item__like');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    btn.classList.toggle('home-product-item__like--liked');
});

// ===== Bộ lọc "Sắp xếp theo" =====
(function initHomeFilter() {
    const buttons = $$('.home-filter__btn');
    buttons.forEach((btn) => {
        btn.addEventListener('click', () => setActive(buttons, btn, 'btn--primary'));
    });
})();

// ===== Thanh sắp xếp trong header =====
(function initSortBar() {
    const items = $$('.header__sort-item');
    items.forEach((item) => {
        $('.header__sort-link', item).addEventListener('click', (e) => {
            e.preventDefault();
            setActive(items, item, 'header__sort-item--active');
        });
    });
})();

// ===== Dropdown chọn "Giá" =====
(function initSelectInput() {
    $$('.select-input').forEach((select) => {
        const label = $('.select-input__label', select);
        $$('.select-input__link', select).forEach((link) => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                label.textContent = link.textContent;
            });
        });
    });
})();

// ===== Phân trang =====
(function initPagination() {
    const items = $$('.pagination-item');
    if (items.length === 0) return;

    const prevBtn = items[0];
    const nextBtn = items[items.length - 1];
    const pageItems = items.filter((item) => item !== prevBtn && item !== nextBtn);

    function goToPage(target) {
        setActive(pageItems, target, 'pagination-item--active');
    }

    pageItems.forEach((item) => {
        $('.pagination-item__link', item).addEventListener('click', (e) => {
            e.preventDefault();
            goToPage(item);
        });
    });

    prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const current = pageItems.findIndex((item) => item.classList.contains('pagination-item--active'));
        if (current > 0) goToPage(pageItems[current - 1]);
    });

    nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const current = pageItems.findIndex((item) => item.classList.contains('pagination-item--active'));
        if (current < pageItems.length - 1) goToPage(pageItems[current + 1]);
    });
})();

// ===== Lưới sản phẩm theo danh mục (dữ liệu thật từ /api/products) =====
function formatVnd(amount) {
    if (amount === null || amount === undefined || amount === '') return '';
    return Number(amount).toLocaleString('vi-VN') + 'đ';
}

function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (ch) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[ch]));
}

function buildProductCardHtml(product) {
    const hasDiscount = product.sale_price != null && product.sale_price !== '' && Number(product.sale_price) < Number(product.price);
    const currentPrice = hasDiscount ? product.sale_price : product.price;
    const discountPercent = hasDiscount ? Math.round((1 - product.sale_price / product.price) * 100) : 0;
    const ratingFilled = Math.max(0, Math.min(5, Math.round(product.rating || 0)));
    const outOfStock = Number(product.stock_qty || 0) <= 0;

    const stars = Array.from({ length: 5 }, (_, i) =>
        `<i class="${i < ratingFilled ? 'home-product-item__star--gold' : ''} fa-solid fa-star"></i>`
    ).join('');

    return `
        <div class="col l-2-4 m-4 c-6">
            <a class="home-product-item" href="product-detail.html?id=${encodeURIComponent(product.id)}" data-product-id="${escapeHtml(product.id)}">
                <div class="home-product-item__img home-product-item__img--placeholder js-product-img" data-image="${escapeHtml(product.image || '')}">
                    <span class="home-product-item__img-alt">${escapeHtml(product.name)}</span>
                </div>
                <h4 class="home-product-item__name">${escapeHtml(product.name)}</h4>
                <div class="home-product-item__price">
                    ${hasDiscount ? `<span class="home-product-item__price-old">${formatVnd(product.price)}</span>` : ''}
                    <span class="home-product-item__price-current">${formatVnd(currentPrice)}</span>
                </div>
                <div class="home-product-item__action">
                    <span class="home-product-item__like">
                        <i class="home-product-item__like-icon-empty fa-regular fa-heart"></i>
                        <i class="home-product-item__like-icon-fill fa-solid fa-heart"></i>
                    </span>
                    <span class="home-product-item__add-cart"${outOfStock ? ' style="opacity:.4;pointer-events:none"' : ''} title="${outOfStock ? 'Hết hàng' : 'Thêm vào giỏ hàng'}">
                        <i class="fa-solid fa-cart-plus"></i>
                    </span>
                    <div class="home-product-item__rating">${stars}</div>
                    <span class="home-product-item__sold">${outOfStock ? 'Hết hàng' : `${product.sold_count || 0} đã bán`}</span>
                </div>
                <div class="home-product-item__origin">
                    ${product.brand ? `<span class="home-product-item__brand">${escapeHtml(product.brand)}</span>` : ''}
                    ${product.origin ? `<span class="home-product-item__origin-name">${escapeHtml(product.origin)}</span>` : ''}
                </div>
                ${hasDiscount ? `
                <div class="home-product-item__sale-off">
                    <span class="home-product-item__sale-off-percent">${discountPercent}%</span>
                    <span class="home-product-item__sale-off-label">GIẢM</span>
                </div>` : ''}
            </a>
        </div>
    `;
}

function hydrateProductImages(container) {
    $$('.js-product-img', container).forEach((el) => {
        const file = el.dataset.image;
        if (!file) return;
        const url = `asset/img/products/${file}`;
        const probe = new Image();
        probe.onload = () => {
            el.classList.remove('home-product-item__img--placeholder');
            el.style.backgroundImage = `url(${url})`;
            el.innerHTML = '';
        };
        probe.src = url;
    });
}

async function loadProductGrid() {
    const grid = $('#product-grid');
    if (!grid) return;

    const category = grid.dataset.category || '';
    const subcategory = new URLSearchParams(location.search).get('sub') || '';

    const query = new URLSearchParams();
    if (category) query.set('category', category);
    if (subcategory) query.set('subcategory', subcategory);

    const emptyMessage = `Chưa có sản phẩm nào${subcategory ? ` trong "${escapeHtml(subcategory)}"` : category ? ` thuộc danh mục "${escapeHtml(category)}"` : ''}.`;

    try {
        const { products } = await api(`/api/products${query.toString() ? `?${query}` : ''}`);
        if (products.length === 0) {
            grid.innerHTML = `<p style="padding:40px 0;text-align:center;color:#767676;width:100%;">${emptyMessage}</p>`;
            return;
        }
        grid.innerHTML = products.map(buildProductCardHtml).join('');
        hydrateProductImages(grid);
    } catch (err) {
        grid.innerHTML = `<p style="padding:40px 0;text-align:center;color:#767676;width:100%;">Không tải được danh sách sản phẩm. Vui lòng thử lại.</p>`;
    }
}

initSession();
loadProductGrid();
