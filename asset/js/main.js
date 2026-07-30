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
(function initCart() {
    $$('.home-product-item__add-cart').forEach((btn) => {
        btn.addEventListener('click', async (e) => {
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
$$('.home-product-item__like').forEach((btn) => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        btn.classList.toggle('home-product-item__like--liked');
    });
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

initSession();
