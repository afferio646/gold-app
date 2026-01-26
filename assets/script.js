// common JS for all apps
document.addEventListener('DOMContentLoaded', () => {
    // Shared initialization if needed
});

function toggleModal(modalId, show = true) {
    const modal = document.getElementById(modalId);
    if(show) modal.classList.remove('hidden');
    else modal.classList.add('hidden');
}
