'use strict';

/*
  product-detail.js
  Hành vi JS riêng cho trang chi tiết sản phẩm: đổi ảnh xem trước, chọn phân loại, tăng/giảm số lượng.
  Vanilla JS, không cần build step, load bằng <script defer> giống main.js.
*/

// Đổi ảnh chính khi bấm vào ảnh nhỏ (thumbnail)
const mainImage = document.getElementById('product-main-image');
const thumbs = document.querySelectorAll('.js-product-thumb');

thumbs.forEach((thumb) => {
    thumb.addEventListener('click', () => {
        thumbs.forEach((item) => item.classList.remove('product-detail__thumb--active'));
        thumb.classList.add('product-detail__thumb--active');

        const bgImage = thumb.style.backgroundImage;
        if (mainImage && bgImage) {
            mainImage.style.backgroundImage = bgImage;
        }
    });
});

// Chọn phân loại (màu sắc / loại) - chỉ đổi trạng thái active
const variationOptions = document.querySelectorAll('.js-variation-option');

variationOptions.forEach((option) => {
    option.addEventListener('click', () => {
        variationOptions.forEach((item) => item.classList.remove('product-detail__variation-option--active'));
        option.classList.add('product-detail__variation-option--active');
    });
});

// Tăng / giảm số lượng
const quantityInput = document.getElementById('product-quantity-input');
const decreaseBtn = document.getElementById('product-quantity-decrease');
const increaseBtn = document.getElementById('product-quantity-increase');
const MAX_QUANTITY = 99;

function clampQuantity(value) {
    if (Number.isNaN(value) || value < 1) return 1;
    if (value > MAX_QUANTITY) return MAX_QUANTITY;
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
