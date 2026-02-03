// common JS for all apps
document.addEventListener('DOMContentLoaded', () => {
    // Shared initialization if needed
});

function toggleModal(modalId, show = true) {
    const modal = document.getElementById(modalId);
    if(show) modal.classList.remove('hidden');
    else modal.classList.add('hidden');
}

function updatePhotoCount(inputId, countId) {
    const input = document.getElementById(inputId);
    const countSpan = document.getElementById(countId);
    if(input.files.length > 0) {
        countSpan.innerText = `${input.files.length} Photo(s) Attached`;
        countSpan.classList.add('text-[var(--g-cyan)]');
        countSpan.classList.remove('text-gray-500');
    } else {
        countSpan.innerText = 'No photos selected';
        countSpan.classList.remove('text-[var(--g-cyan)]');
        countSpan.classList.add('text-gray-500');
    }
}
