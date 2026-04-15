// Logic for the login page
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');

    // Hardcoded credentials for simplicity as requested
    const VALID_USER = "maria";
    const VALID_PASS = "historia";

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            if (username === VALID_USER && password === VALID_PASS) {
                // Set the login token in localStorage
                localStorage.setItem('lavemhistoriaToken', 'true');
                
                // Redirect to the main page
                window.location.href = 'index.html';
            } else {
                // Show error message
                errorMessage.style.display = 'block';
                
                // Clear password field
                document.getElementById('password').value = '';
            }
        });
    }

    // Direct check: if already logged in, go to index
    if (localStorage.getItem('lavemhistoriaToken') === 'true') {
        window.location.href = 'index.html';
    }
});
