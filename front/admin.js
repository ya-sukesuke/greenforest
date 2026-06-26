// admin.js
const passwordHash = "greenforest";
const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');
const passwordInput = document.getElementById('passwordInput');
const loginBtn = document.getElementById('loginBtn');
const errorMessage = document.getElementById('errorMessage');
const logoutBtn = document.getElementById('logoutBtn');

// ログイン状態のチェック
function checkLoginState() {
    if (sessionStorage.getItem('admin_logged_in') === 'true') {
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
    } else {
        loginSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
    }
}

// ログイン処理
function handleLogin() {
    const password = passwordInput.value;
    if (password === passwordHash) {
        sessionStorage.setItem('admin_logged_in', 'true');
        errorMessage.classList.add('hidden');
        passwordInput.value = '';
        checkLoginState();
    } else {
        errorMessage.classList.remove('hidden');
    }
}

// ログアウト処理
function handleLogout() {
    sessionStorage.removeItem('admin_logged_in');
    checkLoginState();
}

loginBtn.addEventListener('click', handleLogin);
passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        handleLogin();
    }
});

logoutBtn.addEventListener('click', handleLogout);

// 初期チェック
checkLoginState();
