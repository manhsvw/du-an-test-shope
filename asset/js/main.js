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

// Modal đăng nhập / đăng ký
(function initAuthModal() {
    const modal = $('#modal');
    if (!modal) return;

    const forms = $$('.auth-form', modal);

    function showForm(mode) {
        forms.forEach((form) => {
            form.hidden = form.dataset.authForm !== mode;
        });
    }

    function openModal(mode) {
        showForm(mode);
        modal.hidden = false;
    }

    function closeModal() {
        modal.hidden = true;
    }

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
        el.addEventListener('click', () => showForm(el.dataset.authSwitch));
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.hidden) closeModal();
    });
})();

// Yêu thích sản phẩm
$$('.home-product-item__like').forEach((btn) => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        btn.classList.toggle('home-product-item__like--liked');
    });
});

// Giỏ hàng: xóa sản phẩm
(function initCart() {
    const cartList = $('.header__cart-list');
    const cartNotice = $('.header__cart-notice');
    if (!cartList || !cartNotice) return;

    $$('.header__cart-item-remove', cartList).forEach((btn) => {
        btn.addEventListener('click', () => {
            btn.closest('.header__cart-item').remove();

            const remaining = $$('.header__cart-item', cartList).length;
            cartNotice.textContent = remaining;
            cartList.classList.toggle('header__cart-list--no-cart', remaining === 0);
        });
    });
})();

// Bộ lọc "Sắp xếp theo"
(function initHomeFilter() {
    const buttons = $$('.home-filter__btn');
    buttons.forEach((btn) => {
        btn.addEventListener('click', () => setActive(buttons, btn, 'btn--primary'));
    });
})();

// Thanh sắp xếp trong header
(function initSortBar() {
    const items = $$('.header__sort-item');
    items.forEach((item) => {
        $('.header__sort-link', item).addEventListener('click', (e) => {
            e.preventDefault();
            setActive(items, item, 'header__sort-item--active');
        });
    });
})();

// Danh mục bên trái
(function initCategory() {
    const items = $$('.category-item');
    items.forEach((item) => {
        $('.category-item__link', item).addEventListener('click', (e) => {
            e.preventDefault();
            setActive(items, item, 'category-item--active');
        });
    });
})();

// Dropdown chọn "Giá"
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

// Phân trang
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
