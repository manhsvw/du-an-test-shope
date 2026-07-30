document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contact-form');
    const success = document.getElementById('contact-success');
    if (!form || !success) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        success.hidden = false;
        form.reset();
    });
});
