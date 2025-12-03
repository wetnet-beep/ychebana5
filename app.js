// ОТКЛЮЧАЕМ Service Worker ДЛЯ ВСЕХ БРАУЗЕРОВ
if (navigator.serviceWorker) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
            registration.unregister();
        }
    });
}
// Глобальные переменные
let currentUser = null;
let userKey = null;
let keyExpiry = null;
let isOffline = false;
let uploadedPhotos = [];

// DOM элементы
const elements = {
    themeToggle: document.getElementById('themeToggle'),
    keyStatus: document.getElementById('keyStatus'),
    keyTimer: document.getElementById('keyTimer'),
    daysLeft: document.getElementById('daysLeft'),
    progressFill: document.getElementById('progressFill'),
    expiryDate: document.getElementById('expiryDate'),
    equationInput: document.getElementById('equationInput'),
    solveBtn: document.getElementById('solveBtn'),
    stepsContainer: document.getElementById('stepsContainer'),
    resultContainer: document.getElementById('resultContainer'),
    menuToggle: document.getElementById('menuToggle'),
    mainNav: document.getElementById('mainNav'),
    navLinks: document.querySelectorAll('.nav-link'),
    sections: document.querySelectorAll('.section'),
    loader: document.getElementById('loader'),
    notification: document.getElementById('notification'),
    keyInput: document.getElementById('keyInput'),
    activateKey: document.getElementById('activateKey'),
    photoUpload: document.getElementById('photoUpload'),
    uploadBtn: document.getElementById('uploadBtn'),
    uploadArea: document.getElementById('uploadArea'),
    gallery: document.getElementById('gallery'),
    operationBtns: document.querySelectorAll('.operation-btn'),
    opDisplay: document.getElementById('opDisplay'),
    calculateColumn: document.getElementById('calculateColumn'),
    columnResult: document.getElementById('columnResult')
};

// ==================== ИНИЦИАЛИЗАЦИЯ ====================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('УчебаНа5+ загружается...');
    
    // Создаем уникальный ID пользователя
    await initializeUser();
    
    // Загружаем данные пользователя
    loadUserData();
    
    // Инициализируем тему
    initializeTheme();
    
    // Инициализируем навигацию
    initializeNavigation();
    
    // Инициализируем загрузку фото
    initializePhotoUpload();
    
    // Инициализируем решалку
    initializeSolver();
    
    // Инициализируем математику в столбик
    initializeColumnMath();
    
    // Инициализируем систему ключей
    initializeKeySystem();
    
    // Проверяем онлайн статус
    checkOnlineStatus();
    
    // ===== УДАЛИЛ Service Worker =====
    // registerServiceWorker(); ← НЕТ ЭТОЙ СТРОКИ!
    
    // Скрываем загрузчик
    setTimeout(() => {
        elements.loader.style.display = 'none';
        showNotification('Приложение загружено!', 'success');
    }, 1000);
});

// ==================== СИСТЕМА ПОЛЬЗОВАТЕЛЯ ====================

async function initializeUser() {
    let userId = localStorage.getItem('user_id');
    
    if (!userId) {
        // Генерируем уникальный ID пользователя
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('user_id', userId);
        
        // Записываем первую дату использования
        const firstUse = {
            date: new Date().toISOString(),
            userAgent: navigator.userAgent,
            platform: navigator.platform
        };
        localStorage.setItem('first_use', JSON.stringify(firstUse));
    }
    
    currentUser = {
        id: userId,
        deviceId: await getDeviceId()
    };
    
    console.log('Пользователь инициализирован:', currentUser.id);
}

async function getDeviceId() {
    // Создаем уникальный ID устройства на основе доступной информации
    const navigatorInfo = navigator.userAgent + navigator.platform + navigator.language;
    const canvasId = await getCanvasFingerprint();
    
    // Хешируем для конфиденциальности
    const hash = await sha256(navigatorInfo + canvasId);
    return hash;
}

async function getCanvasFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 200;
    canvas.height = 50;
    
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(0, 0, 200, 50);
    ctx.fillStyle = '#069';
    ctx.fillText('УчебаНа5+', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('УчебаНа5+', 4, 17);
    
    return canvas.toDataURL();
}

async function sha256(message) {
    // Простой хеш для демонстрации
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function loadUserData() {
    // Загружаем тему
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.className = savedTheme;
        updateThemeIcon();
    }
    
    // Загружаем фото
    const savedPhotos = localStorage.getItem('user_photos');
    if (savedPhotos) {
        uploadedPhotos = JSON.parse(savedPhotos);
        renderGallery();
    }
    
    // Загружаем данные ключа
    const savedKeyData = localStorage.getItem('key_data');
    if (savedKeyData) {
        const keyData = JSON.parse(savedKeyData);
        userKey = keyData.key;
        keyExpiry = new Date(keyData.expiry);
        
        if (isKeyValid()) {
            activatePremiumFeatures(true);
            updateKeyTimer();
        } else {
            // Ключ истек
            localStorage.removeItem('key_data');
            userKey = null;
            keyExpiry = null;
        }
    }
}

// ==================== ТЕМА ====================

function initializeTheme() {
    elements.themeToggle.addEventListener('click', toggleTheme);
    updateThemeIcon();
}

function toggleTheme() {
    const isDark = document.body.classList.contains('dark-theme');
    
    if (isDark) {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        localStorage.setItem('theme', 'light-theme');
    } else {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark-theme');
    }
    
    updateThemeIcon();
}

function updateThemeIcon() {
    const icon = elements.themeToggle.querySelector('i');
    const isDark = document.body.classList.contains('dark-theme');
    
    if (isDark) {
        icon.className = 'fas fa-sun';
        elements.themeToggle.title = 'Включить светлую тему';
    } else {
        icon.className = 'fas fa-moon';
        elements.themeToggle.title = 'Включить темную тему';
    }
}

// ==================== НАВИГАЦИЯ ====================

function initializeNavigation() {
    // Меню для мобильных
    elements.menuToggle.addEventListener('click', () => {
        elements.mainNav.classList.toggle('active');
    });
    
    // Переключение разделов
    elements.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Убираем активный класс у всех ссылок
            elements.navLinks.forEach(l => l.classList.remove('active'));
            
            // Добавляем активный класс текущей ссылке
            link.classList.add('active');
            
            // Скрываем все разделы
            elements.sections.forEach(section => {
                section.classList.remove('active');
            });
            
            // Показываем нужный раздел
            const targetId = link.getAttribute('href').substring(1);
            document.getElementById(targetId).classList.add('active');
            
            // Скрываем меню на мобильных
            if (window.innerWidth <= 768) {
                elements.mainNav.classList.remove('active');
            }
        });
    });
}

// ==================== MATH.JS РЕШАЛКА ====================

function initializeSolver() {
    elements.solveBtn.addEventListener('click', solveWithMathJS);
    elements.equationInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') solveWithMathJS();
    });
}

function solveWithMathJS() {
    const equation = elements.equationInput.value.trim();
    
    if (!equation) {
        showNotification('Введите уравнение!', 'error');
        return;
    }
    
    // Проверяем премиум доступ
    if (!isPremiumUser()) {
        showPremiumLocked();
        return;
    }
    
    try {
        elements.stepsContainer.innerHTML = '';
        elements.resultContainer.innerHTML = '';
        
        const solution = solveEquationMathJS(equation);
        displayMathJSSolution(solution);
        
        showNotification('✅ Уравнение решено!', 'success');
        
    } catch (error) {
        console.error('Ошибка решения:', error);
        showNotification('Ошибка в уравнении', 'error');
        showError(error.message, equation);
    }
}

// Основная функция решения
function solveEquationMathJS(equation) {
    const steps = [];
    steps.push(`📝 Исходное уравнение: ${equation}`);
    
    // Нормализуем
    const normalized = equation.replace(/\s/g, '').toLowerCase();
    steps.push(`🔧 Нормализованное: ${normalized}`);
    
    // Проверяем что есть =
    if (!normalized.includes('=')) {
        throw new Error('Уравнение должно содержать знак "="');
    }
    
    // Ищем переменную
    const variables = [...new Set(normalized.match(/[a-z]/gi) || [])];
    if (variables.length === 0) {
        throw new Error('Не найдена переменная (используйте x, y, z и т.д.)');
    }
    
    const variable = variables[0];
    steps.push(`🎯 Решаем относительно: ${variable}`);
    
    // Пробуем решить с math.js
    let solutions;
    try {
        // Преобразуем уравнение для math.js
        const expr = math.parse(normalized);
        solutions = math.solve(expr, variable);
        steps.push(`⚡ Использован math.js решатель`);
    } catch (mathError) {
        steps.push(`⚠ Math.js не справился, используем численный метод`);
        solutions = numericalSolve(normalized, variable);
    }
    
    // Проверяем решение
    const verification = verifySolutionMathJS(normalized, variable, solutions);
    
    return {
        equation: equation,
        normalized: normalized,
        variable: variable,
        solutions: solutions,
        steps: steps,
        verification: verification,
        solvedAt: new Date().toISOString()
    };
}

// Численное решение если math.js не справился
function numericalSolve(equation, variable) {
    // Пробуем значения от -1000 до 1000
    const solutions = [];
    
    for (let x = -1000; x <= 1000; x += 0.1) {
        try {
            const testEq = equation.replace(new RegExp(variable, 'gi'), `(${x})`);
            const [left, right] = testEq.split('=');
            
            const leftVal = safeEvaluate(left);
            const rightVal = safeEvaluate(right);
            
            if (Math.abs(leftVal - rightVal) < 0.001) {
                const rounded = Math.round(x * 100) / 100;
                if (!solutions.includes(rounded)) {
                    solutions.push(rounded);
                }
            }
        } catch (e) {
            continue;
        }
    }
    
    return solutions.length > 0 ? solutions : ['Решение не найдено'];
}

// Безопасное вычисление
function safeEvaluate(expr) {
    try {
        // Убираем всё кроме чисел и операторов
        const cleanExpr = expr.replace(/[^0-9+\-*/().]/g, '');
        return math.evaluate(cleanExpr);
    } catch (e) {
        throw new Error('Не удалось вычислить выражение');
    }
}

// Проверка решения
function verifySolutionMathJS(equation, variable, solutions) {
    if (!Array.isArray(solutions) || solutions.length === 0) {
        return null;
    }
    
    const verifications = [];
    
    solutions.forEach((solution, index) => {
        if (typeof solution === 'number') {
            try {
                const testEq = equation.replace(new RegExp(variable, 'gi'), `(${solution})`);
                const [left, right] = testEq.split('=');
                
                const leftVal = math.evaluate(left);
                const rightVal = math.evaluate(right);
                const difference = Math.abs(leftVal - rightVal);
                
                verifications.push({
                    solution: solution,
                    left: math.round(leftVal, 4),
                    right: math.round(rightVal, 4),
                    difference: difference,
                    isValid: difference < 0.01
                });
            } catch (e) {
                // Пропускаем ошибки проверки
            }
        }
    });
    
    return verifications;
}

// Показать решение
function displayMathJSSolution(solution) {
    // Шаги решения
    let stepsHTML = '<div class="mathjs-steps">';
    stepsHTML += '<h4><i class="fas fa-list-ol"></i> Процесс решения:</h4>';
    
    solution.steps.forEach((step, index) => {
        stepsHTML += `
            <div class="mathjs-step">
                <span class="step-number">${index + 1}</span>
                <span class="step-text">${step}</span>
            </div>
        `;
    });
    stepsHTML += '</div>';
    
    elements.stepsContainer.innerHTML = stepsHTML;
    
    // Результат
    let resultHTML = '<div class="mathjs-result">';
    
    if (Array.isArray(solution.solutions) && solution.solutions.length > 0) {
        if (solution.solutions.length === 1) {
            const sol = solution.solutions[0];
            if (typeof sol === 'number') {
                resultHTML += `
                    <h2><i class="fas fa-check-circle"></i> Решение найдено!</h2>
                    <div class="main-answer">${solution.variable} = ${sol}</div>
                `;
            } else {
                resultHTML += `<h3>${sol}</h3>`;
            }
        } else {
            resultHTML += '<h3><i class="fas fa-th-list"></i> Найдено несколько решений:</h3>';
            solution.solutions.forEach((sol, idx) => {
                resultHTML += `
                    <div class="multiple-solution">
                        ${solution.variable}<sub>${idx + 1}</sub> = ${sol}
                    </div>
                `;
            });
        }
        
        // Проверка
        if (solution.verification && solution.verification.length > 0) {
            solution.verification.forEach(check => {
                if (check.isValid) {
                    resultHTML += `
                        <div class="verification valid">
                            <i class="fas fa-check"></i> Проверка: ${check.left} = ${check.right}
                        </div>
                    `;
                } else {
                    resultHTML += `
                        <div class="verification approx">
                            <i class="fas fa-approximately-equal"></i> 
                            Приблизительно: ${check.left} ≈ ${check.right}
                            <small>(разница: ${check.difference.toFixed(6)})</small>
                        </div>
                    `;
                }
            });
        }
    } else {
        resultHTML += '<h3><i class="fas fa-times-circle"></i> Решений не найдено</h3>';
    }
    
    resultHTML += `
        <div class="solution-info">
            <small>
                <i class="fas fa-clock"></i> ${new Date(solution.solvedAt).toLocaleTimeString('ru-RU')}
                <i class="fas fa-calculator"></i> Math.js ${math.version}
            </small>
        </div>
    `;
    
    resultHTML += '</div>';
    elements.resultContainer.innerHTML = resultHTML;
}

// Показать ошибку
function showError(errorMsg, equation) {
    elements.resultContainer.innerHTML = `
        <div class="mathjs-error">
            <h3><i class="fas fa-exclamation-triangle"></i> Ошибка</h3>
            <p>${errorMsg}</p>
            
            <div class="error-examples">
                <h4>Примеры уравнений которые работают:</h4>
                <ul>
                    <li><code>2x + 5 = 15</code> → x = 5</li>
                    <li><code>3(x - 4) = 21</code> → x = 11</li>
                    <li><code>x^2 - 4 = 0</code> → x = -2, 2</li>
                    <li><code>12x + 9x + 100 = 21100</code> → x = 1000</li>
                    <li><code>(x+1000-2000)*10=10000</code> → x = 2000</li>
                </ul>
            </div>
        </div>
    `;
}

// Для бесплатных пользователей
function showPremiumLocked() {
    elements.resultContainer.innerHTML = `
        <div class="premium-locked-mathjs">
            <div class="lock-icon">
                <i class="fas fa-lock fa-3x"></i>
            </div>
            <h3>Решалка уравнений заблокирована</h3>
            <p>Для использования мощного math.js решателя активируйте ключ</p>
            <p><small>Получите доступ к решению любых уравнений!</small></p>
            <button class="btn btn-primary btn-large" 
                    onclick="document.querySelector('[href=\\'#key\\']').click()">
                <i class="fas fa-key"></i> Активировать ключ
            </button>
        </div>
    `;
}
// ==================== МАТЕМАТИКА В СТОЛБИК (ИСПРАВЛЕННАЯ) ====================

function initializeColumnMath() {
    // Переключение операций
    elements.operationBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.operationBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            elements.opDisplay.textContent = btn.dataset.op;
        });
    });
    
    // Расчет
    elements.calculateColumn.addEventListener('click', calculateColumn);
}

function calculateColumn() {
    const num1 = document.getElementById('num1').value;
    const num2 = document.getElementById('num2').value;
    const operation = document.getElementById('opDisplay').textContent;
    
    if (!num1 || !num2) {
        showNotification('Введите оба числа!', 'error');
        return;
    }
    
    const a = parseFloat(num1);
    const b = parseFloat(num2);
    
    if (isNaN(a) || isNaN(b)) {
        showNotification('Введите корректные числа!', 'error');
        return;
    }
    
    let result = '';
    
    switch (operation) {
        case '+':
            result = addColumn(a, b);
            break;
        case '-':
            result = subtractColumn(a, b);
            break;
        case '×':  // ВАЖНО: это знак умножения, не звездочка!
            result = multiplyColumn(a, b);
            break;
        case '/':
            if (b === 0) {
                result = 'Ошибка: деление на ноль!';
            } else {
                result = divideColumn(a, b);
            }
            break;
        default:
            result = 'Неизвестная операция';
    }
    
    elements.columnResult.textContent = result;
    elements.columnResult.style.display = 'block';
}

function addColumn(a, b) {
    const sum = a + b;
    const aStr = a.toString();
    const bStr = b.toString();
    const sumStr = sum.toString();
    
    const maxLength = Math.max(aStr.length, bStr.length, sumStr.length);
    
    let result = '';
    result += ' '.repeat(maxLength - aStr.length + 2) + aStr + '\n';
    result += '+ ' + ' '.repeat(maxLength - bStr.length + 1) + bStr + '\n';
    result += '—'.repeat(maxLength + 3) + '\n';
    result += ' '.repeat(maxLength - sumStr.length + 2) + sumStr;
    
    return result;
}

function subtractColumn(a, b) {
    const diff = a - b;
    const aStr = a.toString();
    const bStr = b.toString();
    const diffStr = diff.toString();
    
    const maxLength = Math.max(aStr.length, bStr.length, diffStr.length);
    
    let result = '';
    result += ' '.repeat(maxLength - aStr.length + 2) + aStr + '\n';
    result += '- ' + ' '.repeat(maxLength - bStr.length + 1) + bStr + '\n';
    result += '—'.repeat(maxLength + 3) + '\n';
    result += ' '.repeat(maxLength - diffStr.length + 2) + diffStr;
    
    return result;
}

function multiplyColumn(a, b) {
    const product = a * b;
    const aStr = a.toString();
    const bStr = b.toString();
    const productStr = product.toString();
    
    const maxLength = Math.max(aStr.length, bStr.length, productStr.length);
    
    let result = '';
    result += ' '.repeat(maxLength - aStr.length + 2) + aStr + '\n';
    result += '× ' + ' '.repeat(maxLength - bStr.length + 1) + bStr + '\n';
    result += '—'.repeat(maxLength + 3) + '\n';
    
    // Если умножаем на многозначное число
    if (b > 9 || b < -9) {
        const bDigits = Math.abs(b).toString().split('').reverse();
        let partialResults = [];
        
        bDigits.forEach((digit, index) => {
            const partial = a * parseInt(digit);
            const partialStr = partial.toString();
            const indent = ' '.repeat(index);
            partialResults.push(indent + ' '.repeat(maxLength - partialStr.length + 2) + partialStr);
        });
        
        result += partialResults.join('\n') + '\n';
        result += '—'.repeat(maxLength + 3) + '\n';
        result += ' '.repeat(maxLength - productStr.length + 2) + productStr;
    } else {
        // Для однозначного числа сразу результат
        result += ' '.repeat(maxLength - productStr.length + 2) + productStr;
    }
    
    return result;
}

function divideColumn(a, b) {
    if (b === 0) return 'Ошибка: деление на ноль!';
    
    const quotient = Math.floor(a / b);
    const remainder = a % b;
    
    let result = '';
    result += `   ${a} ÷ ${b}\n`;
    result += '—'.repeat(Math.max(a.toString().length, b.toString().length) + 4) + '\n';
    result += `   Частное: ${quotient}\n`;
    
    if (remainder !== 0) {
        result += `   Остаток: ${remainder}`;
    }
    
    return result;
}
// ==================== ФОТО И ПАМЯТКИ ====================

function initializePhotoUpload() {
    // Кнопка загрузки
    elements.uploadBtn.addEventListener('click', () => {
        elements.photoUpload.click();
    });
    
    // Drag and drop область
    elements.uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.uploadArea.style.borderColor = 'var(--primary-color)';
        elements.uploadArea.style.backgroundColor = 'var(--hover-bg)';
    });
    
    elements.uploadArea.addEventListener('dragleave', () => {
        elements.uploadArea.style.borderColor = '';
        elements.uploadArea.style.backgroundColor = '';
    });
    
    elements.uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.uploadArea.style.borderColor = '';
        elements.uploadArea.style.backgroundColor = '';
        
        const files = e.dataTransfer.files;
        handlePhotoUpload(files);
    });
    
    // Выбор файлов через input
    elements.photoUpload.addEventListener('change', (e) => {
        handlePhotoUpload(e.target.files);
    });
}

function handlePhotoUpload(files) {
    if (!files || files.length === 0) return;
    
    const maxPhotos = isPremiumUser() ? 50 : 10;
    
    if (uploadedPhotos.length + files.length > maxPhotos) {
        showNotification(`Максимум ${maxPhotos} фото! Активируйте ключ для большего количества.`, 'warning');
        return;
    }
    
    Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) {
            showNotification('Пожалуйста, загружайте только изображения!', 'error');
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const photoData = {
                id: 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                data: e.target.result,
                name: file.name,
                size: file.size,
                type: file.type,
                uploaded: new Date().toISOString()
            };
            
            uploadedPhotos.push(photoData);
            savePhotosToStorage();
            renderGallery();
            
            showNotification(`Фото "${file.name}" загружено!`, 'success');
        };
        
        reader.readAsDataURL(file);
    });
    
    // Сбрасываем input
    elements.photoUpload.value = '';
}

function savePhotosToStorage() {
    localStorage.setItem('user_photos', JSON.stringify(uploadedPhotos));
}

function renderGallery() {
    if (uploadedPhotos.length === 0) {
        elements.gallery.innerHTML = `
            <div class="empty-gallery">
                <i class="fas fa-images fa-3x"></i>
                <p>Нет загруженных фото</p>
                <p class="small">Загрузите первое фото, чтобы создать памятку</p>
            </div>
        `;
        return;
    }
    
    let galleryHTML = '';
    
    uploadedPhotos.forEach(photo => {
        galleryHTML += `
            <div class="photo-item" data-id="${photo.id}">
                <img src="${photo.data}" alt="${photo.name}">
                <div class="photo-actions">
                    <button class="btn btn-icon small" onclick="viewPhoto('${photo.id}')" title="Увеличить">
                        <i class="fas fa-search-plus"></i>
                    </button>
                    <button class="btn btn-icon small" onclick="deletePhoto('${photo.id}')" title="Удалить">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="photo-info">
                    <p class="small">${photo.name}</p>
                    <p class="small">${new Date(photo.uploaded).toLocaleDateString()}</p>
                </div>
            </div>
        `;
    });
    
    elements.gallery.innerHTML = galleryHTML;
}

// ==================== СИСТЕМА КЛЮЧЕЙ ====================

function initializeKeySystem() {
    elements.activateKey.addEventListener('click', activateKey);
    
    elements.keyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            activateKey();
        }
    });
}

// Массив валидных ключей (40 штук)
const VALID_KEYS = [
    'UCH-NA5-SUN-723', 'UCH-NA5-MOON-841', 'UCH-NA5-STAR-309',
    'UCH-NA5-BOOK-456', 'UCH-NA5-PEN-182', 'UCH-NA5-DESK-574',
    'UCH-NA5-LAMP-960', 'UCH-NA5-CODE-235', 'UCH-NA5-LEARN-618',
    'UCH-NA5-BRAIN-777', 'UCH-NA5-EXAM-112', 'UCH-NA5-TEST-889',
    'UCH-NA5-MATH-334', 'UCH-NA5-FIVE-665', 'UCH-NA5-PLUS-492',
    'UCH-NA5-MIND-201', 'UCH-NA5-KNOW-876', 'UCH-NA5-WISE-143',
    'UCH-NA5-PEAK-550', 'UCH-NA5-QUIZ-267', 'UCH-NA5-FACT-718',
    'UCH-NA5-ACE-385', 'UCH-NA5-GOAL-924', 'UCH-NA5-HACK-631',
    'UCH-NA5-JAVA-159', 'UCH-NA5-PYTH-472', 'UCH-NA5-OPEN-806',
    'UCH-NA5-TECH-290', 'UCH-NA5-DATA-537', 'UCH-NA5-USER-764',
    'UCH-NA5-FAST-421', 'UCH-NA5-EASY-658', 'UCH-NA5-HELP-995',
    'UCH-NA5-NEXT-120', 'UCH-NA5-WEST-483', 'UCH-NA5-FIRE-739',
    'UCH-NA5-WAVE-256', 'UCH-NA5-ZONE-874', 'UCH-NA5-EDGE-512',
    'UCH-NA5-ROAD-349'
];

// Использованные ключи
const usedKeys = JSON.parse(localStorage.getItem('used_keys') || '[]');

async function activateKey() {
    const key = elements.keyInput.value.trim().toUpperCase();
    
    if (!key) {
        showNotification('Введите ключ!', 'error');
        return;
    }
    
    // Проверяем формат ключа
    const keyRegex = /^UCH-NA5-[A-Z]{3,4}-\d{3}$/;
    if (!keyRegex.test(key)) {
        showNotification('Неверный формат ключа!', 'error');
        return;
    }
    
    // Проверяем, является ли ключ валидным
    if (!VALID_KEYS.includes(key)) {
        showNotification('Недействительный ключ!', 'error');
        return;
    }
    
    // Проверяем, был ли ключ уже использован
    if (usedKeys.includes(key)) {
        showNotification('Этот ключ уже был активирован!', 'warning');
        return;
    }
    
    try {
        // Симулируем проверку на сервере
        const activationResult = await simulateServerActivation(key);
        
        if (activationResult.success) {
            // Сохраняем ключ
            userKey = key;
            keyExpiry = new Date(activationResult.expiry);
            
            // Сохраняем в localStorage
            const keyData = {
                key: key,
                expiry: keyExpiry.toISOString(),
                activated: new Date().toISOString(),
                user: currentUser.id
            };
            
            localStorage.setItem('key_data', JSON.stringify(keyData));
            
            // Добавляем ключ в использованные
            usedKeys.push(key);
            localStorage.setItem('used_keys', JSON.stringify(usedKeys));
            
            // Активируем премиум функции
            activatePremiumFeatures(true);
            updateKeyTimer();
            
            // Очищаем поле ввода
            elements.keyInput.value = '';
            
            showNotification('Ключ успешно активирован! Доступ на 10 дней.', 'success');
            
        } else {
            showNotification('Ошибка активации ключа!', 'error');
        }
        
    } catch (error) {
        console.error('Ошибка активации:', error);
        showNotification('Ошибка сети. Проверьте подключение к интернету.', 'error');
    }
}

async function simulateServerActivation(key) {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Создаем дату окончания (10 дней от текущей даты)
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 10);
            
            resolve({
                success: true,
                key: key,
                expiry: expiryDate.toISOString(),
                activated: new Date().toISOString(),
                deviceId: currentUser.deviceId,
                message: 'Ключ активирован успешно'
            });
        }, 1000);
    });
}

function isKeyValid() {
    if (!keyExpiry) return false;
    
    const now = new Date();
    return now < keyExpiry;
}

function isPremiumUser() {
    return isKeyValid();
}

function activatePremiumFeatures(isActive) {
    if (isActive) {
        // Обновляем статус ключа
        elements.keyStatus.className = 'key-status active';
        elements.keyStatus.innerHTML = '<i class="fas fa-key"></i> <span>Ключ активирован</span>';
        
        // Показываем таймер
        elements.keyTimer.style.display = 'block';
        
    } else {
        elements.keyStatus.className = 'key-status inactive';
        elements.keyStatus.innerHTML = '<i class="fas fa-key"></i> <span>Ключ не активирован</span>';
        
        // Скрываем таймер
        elements.keyTimer.style.display = 'none';
    }
}

function updateKeyTimer() {
    if (!keyExpiry) return;
    
    const now = new Date();
    const timeDiff = keyExpiry - now;
    
    if (timeDiff <= 0) {
        // Время вышло
        activatePremiumFeatures(false);
        return;
    }
    
    // Рассчитываем дни
    const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    elements.daysLeft.textContent = daysLeft;
    
    // Обновляем прогресс-бар
    const totalDays = 10;
    const progress = ((totalDays - daysLeft) / totalDays) * 100;
    elements.progressFill.style.width = `${progress}%`;
    
    // Обновляем дату окончания
    elements.expiryDate.textContent = `Дата окончания: ${keyExpiry.toLocaleDateString('ru-RU')}`;
    
    // Меняем цвет прогресс-бара
    if (daysLeft <= 3) {
        elements.progressFill.style.backgroundColor = '#f44336';
    } else if (daysLeft <= 7) {
        elements.progressFill.style.backgroundColor = '#ff9800';
    } else {
        elements.progressFill.style.backgroundColor = '#4caf50';
    }
}

// ==================== PWA И OFFLINE ====================

function checkOnlineStatus() {
    isOffline = !navigator.onLine;
    
    if (isOffline) {
        showNotification('Работаем в оффлайн режиме', 'info');
    }
    
    window.addEventListener('online', () => {
        isOffline = false;
        showNotification('Соединение восстановлено', 'success');
    });
    
    window.addEventListener('offline', () => {
        isOffline = true;
        showNotification('Работаем оффлайн', 'warning');
    });
}

async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            // ИЗМЕНИТЕ ЭТУ СТРОКУ:
            await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker зарегистрирован');
        } catch (error) {
            console.error('Ошибка регистрации Service Worker:', error);
            // Просто игнорируем ошибку для GitHub Pages
        }
    }
}
// ==================== УТИЛИТЫ ====================

function showNotification(message, type = 'info') {
    const notification = elements.notification;
    
    notification.textContent = message;
    
    const colors = {
        success: '#4caf50',
        error: '#f44336',
        warning: '#ff9800',
        info: '#2196f3'
    };
    
    notification.style.backgroundColor = colors[type] || colors.info;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000);
}

// Экспортируем функции
window.viewPhoto = function(photoId) {
    const photo = uploadedPhotos.find(p => p.id === photoId);
    if (!photo) return;
    
    const modal = document.createElement('div');
    modal.className = 'photo-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
    `;
    
    modal.innerHTML = `
        <div style="position: relative; max-width: 90%; max-height: 90%;">
            <img src="${photo.data}" 
                 alt="${photo.name}" 
                 style="max-width: 100%; max-height: 90vh;">
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="position: absolute; top: -40px; right: 0; 
                           background: none; border: none; color: white; 
                           font-size: 30px; cursor: pointer;">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
};

window.deletePhoto = function(photoId) {
    if (!confirm('Удалить это фото?')) return;
    
    uploadedPhotos = uploadedPhotos.filter(p => p.id !== photoId);
    savePhotosToStorage();
    renderGallery();
    showNotification('Фото удалено!', 'success');
};

// Обновляем таймер каждую минуту
setInterval(() => {
    if (isPremiumUser()) {
        updateKeyTimer();
    }
}, 60000);

// Обновляем таймер при загрузке
if (isPremiumUser()) {
    updateKeyTimer();
}
// ==================== СТАТИСТИКА САЙТА ====================

// Записываем посещение
function recordVisit() {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const visitorId = localStorage.getItem('visitorId');
    
    // Создаем новый ID если первый раз
    if (!visitorId) {
        const newId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('visitorId', newId);
        
        // Увеличиваем счетчик уникальных
        let uniqueCount = parseInt(localStorage.getItem('uniqueVisitors') || '0');
        uniqueCount++;
        localStorage.setItem('uniqueVisitors', uniqueCount.toString());
    }
    
    // Увеличиваем общий счетчик
    let totalCount = parseInt(localStorage.getItem('totalVisits') || '0');
    totalCount++;
    localStorage.setItem('totalVisits', totalCount.toString());
    
    // Записываем посещение за сегодня
    let todayStats = JSON.parse(localStorage.getItem('todayStats') || '{}');
    if (!todayStats.date || todayStats.date !== today) {
        // Новый день
        todayStats = { date: today, count: 1 };
    } else {
        todayStats.count++;
    }
    localStorage.setItem('todayStats', JSON.stringify(todayStats));
    
    // Сохраняем детали посещения
    const visit = {
        id: visitorId || localStorage.getItem('visitorId'),
        timestamp: new Date().toISOString(),
        page: window.location.href
    };
    
    let visitHistory = JSON.parse(localStorage.getItem('visitHistory') || '[]');
    visitHistory.push(visit);
    // Храним только последние 100 посещений
    if (visitHistory.length > 100) {
        visitHistory = visitHistory.slice(-100);
    }
    localStorage.setItem('visitHistory', JSON.stringify(visitHistory));
    
    console.log('📊 Посещение записано:', {
        уникальные: localStorage.getItem('uniqueVisitors'),
        всего: totalCount,
        сегодня: todayStats.count
    });
}

// Показать статистику в углу экрана
function showVisitorCounter() {
    const uniqueVisitors = localStorage.getItem('uniqueVisitors') || '0';
    const totalVisits = localStorage.getItem('totalVisits') || '0';
    const todayStats = JSON.parse(localStorage.getItem('todayStats') || '{"count":0}');
    
    // Создаем элемент счетчика
    const counter = document.createElement('div');
    counter.id = 'visitorCounter';
    counter.style.cssText = `
        position: fixed;
        bottom: 10px;
        left: 10px;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 12px;
        z-index: 9999;
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        gap: 5px;
        cursor: pointer;
        transition: all 0.3s;
    `;
    
    counter.innerHTML = `
        <i class="fas fa-users"></i>
        <span>${uniqueVisitors} уникальных</span>
        <span style="opacity:0.7;">|</span>
        <span>${totalVisits} всего</span>
    `;
    
    // При клике показываем подробности
    counter.addEventListener('click', showDetailedStats);
    
    document.body.appendChild(counter);
    
    // Анимация появления
    setTimeout(() => {
        counter.style.opacity = '1';
    }, 1000);
}

// Показать подробную статистику
function showDetailedStats() {
    const uniqueVisitors = localStorage.getItem('uniqueVisitors') || '0';
    const totalVisits = localStorage.getItem('totalVisits') || '0';
    const todayStats = JSON.parse(localStorage.getItem('todayStats') || '{"count":0,"date":""}');
    const usedKeys = JSON.parse(localStorage.getItem('usedKeys') || '[]');
    
    // Создаем модальное окно
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        backdrop-filter: blur(5px);
    `;
    
    modal.innerHTML = `
        <div style="
            background: white;
            border-radius: 15px;
            padding: 25px;
            max-width: 400px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0; color: #333;">
                    <i class="fas fa-chart-bar"></i> Статистика сайта
                </h3>
                <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                        style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">
                    ×
                </button>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 25px;">
                <div style="background: #e3f2fd; padding: 15px; border-radius: 10px; text-align: center;">
                    <div style="font-size: 28px; font-weight: bold; color: #2196f3;">${uniqueVisitors}</div>
                    <div style="font-size: 12px; color: #666;">Уникальных посетителей</div>
                </div>
                
                <div style="background: #e8f5e9; padding: 15px; border-radius: 10px; text-align: center;">
                    <div style="font-size: 28px; font-weight: bold; color: #4caf50;">${totalVisits}</div>
                    <div style="font-size: 12px; color: #666;">Всего посещений</div>
                </div>
                
                <div style="background: #fff3e0; padding: 15px; border-radius: 10px; text-align: center;">
                    <div style="font-size: 28px; font-weight: bold; color: #ff9800;">${todayStats.count}</div>
                    <div style="font-size: 12px; color: #666;">Посещений сегодня</div>
                </div>
                
                <div style="background: #f3e5f5; padding: 15px; border-radius: 10px; text-align: center;">
                    <div style="font-size: 28px; font-weight: bold; color: #9c27b0;">${usedKeys.length}</div>
                    <div style="font-size: 12px; color: #666;">Активированных ключей</div>
                </div>
            </div>
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
                <h4 style="margin-bottom: 10px; color: #555;">
                    <i class="fas fa-history"></i> История посещений
                </h4>
                <div style="max-height: 200px; overflow-y: auto; font-size: 12px;">
                    ${getVisitHistoryHTML()}
                </div>
            </div>
            
            <div style="margin-top: 20px; text-align: center;">
                <button onclick="exportStats()" style="
                    background: #2196f3;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 14px;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                ">
                    <i class="fas fa-download"></i> Экспорт статистики
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Закрытие по клику на фон
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Получить HTML истории посещений
function getVisitHistoryHTML() {
    const history = JSON.parse(localStorage.getItem('visitHistory') || '[]');
    
    if (history.length === 0) {
        return '<div style="color: #999; text-align: center; padding: 20px;">Нет данных</div>';
    }
    
    // Берем последние 10 посещений
    const lastVisits = history.slice(-10).reverse();
    
    return lastVisits.map(visit => {
        const date = new Date(visit.timestamp);
        return `
            <div style="
                padding: 8px 10px;
                margin: 5px 0;
                background: #f8f9fa;
                border-radius: 5px;
                border-left: 3px solid #2196f3;
                display: flex;
                justify-content: space-between;
            ">
                <div>
                    <i class="far fa-clock"></i>
                    ${date.toLocaleDateString('ru-RU')} ${date.toLocaleTimeString('ru-RU').slice(0,5)}
                </div>
                <div style="color: #666; font-size: 10px;">
                    ID: ${visit.id ? visit.id.substring(0, 8) + '...' : 'неизвестно'}
                </div>
            </div>
        `;
    }).join('');
}

// Экспорт статистики
function exportStats() {
    const stats = {
        uniqueVisitors: localStorage.getItem('uniqueVisitors'),
        totalVisits: localStorage.getItem('totalVisits'),
        todayStats: JSON.parse(localStorage.getItem('todayStats') || '{}'),
        usedKeys: JSON.parse(localStorage.getItem('usedKeys') || '[]'),
        visitHistory: JSON.parse(localStorage.getItem('visitHistory') || '[]'),
        exportDate: new Date().toISOString()
    };
    
    // Создаем JSON файл для скачивания
    const dataStr = JSON.stringify(stats, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `uchebana5_stats_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    alert('Статистика экспортирована в JSON файл!');
}

// Инициализация статистики при загрузке
document.addEventListener('DOMContentLoaded', () => {
    // Записываем посещение с задержкой чтобы не мешать основной загрузке
    setTimeout(() => {
        recordVisit();
        showVisitorCounter();
    }, 2000);
});
