document.addEventListener('DOMContentLoaded', function () {
    const uploadBtn = document.getElementById('upload-btn');
    const manageBtn = document.getElementById('manage-btn');

    // Hardcoded production URL as requested
    const BASE_URL = 'https://access.vercel.app';

    uploadBtn.addEventListener('click', function () {
        chrome.tabs.create({ url: BASE_URL });
    });

    manageBtn.addEventListener('click', function () {
        chrome.tabs.create({ url: BASE_URL + '/manage-access' });
    });
});
