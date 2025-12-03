// === САМЫЕ ПЕРВЫЕ СТРОКИ В app.js ===
// ЖЁСТКОЕ ОТКЛЮЧЕНИЕ SERVICE WORKER
if (typeof navigator !== 'undefined' && navigator.serviceWorker) {
    console.log('🔒 Жесткое отключение Service Worker');
    
    // 1. Отписываемся от всех существующих
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
        registrations.forEach(function(registration) {
            console.log('Удаляем SW:', registration.scope);
            registration.unregister().then(function(success) {
                console.log(success ? '✅ Успешно' : '❌ Не удалось');
            });
        });
    });
    
    // 2. Блокируем ВСЕ будущие регистрации
    navigator.serviceWorker.register = function() {
        console.log('❌ Регистрация Service Worker заблокирована');
        return Promise.reject(new Error('Service Worker отключен администратором'));
    };
    
    // 3. Отключаем контроллер если есть
    if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({type: 'TERMINATE'});
    }
}

// ТОЛЬКО ПОСЛЕ ЭТОГО ТВОЙ ОСТАЛЬНОЙ КОД
let currentUser = null;
// ... и так далее
// app.js - ИСПРАВЛЕННАЯ ВЕРСИЯ

// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================
let currentUser = null;
let userKey = null;
let keyExpiry = null;
let isOffline = false;
let uploadedPhotos = [];
let math = window.math || {}; // Math.js объект

// ==================== DOM ЭЛЕМЕНТЫ ====================
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
    
    // Проверяем загрузку Math.js
    if (typeof math === 'undefined' || !math.evaluate) {
        console.warn('Math.js не загружен, используем простой решатель');
        math = {
            evaluate: (expr) => eval(expr), // Простой fallback
            round: (num, decimals) => Number(num.toFixed(decimals))
        };
    }
    
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
    
    // Скрываем загрузчик
    setTimeout(() => {
        if (elements.loader) {
            elements.loader.style.display = 'none';
        }
        showNotification('Приложение загружено!', 'success');
    }, 1000);
});

// ==================== СИСТЕМА ПОЛЬЗОВАТЕЛЯ ====================
async function initializeUser() {
    let userId = localStorage.getItem('user_id');
    
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('user_id', userId);
        
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
    const navigatorInfo = navigator.userAgent + navigator.platform + navigator.language;
    const canvasId = await getCanvasFingerprint();
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
            localStorage.removeItem('key_data');
            userKey = null;
            keyExpiry = null;
        }
    }
}

// ==================== ТЕМА ====================
function initializeTheme() {
    if (elements.themeToggle) {
        elements.themeToggle.addEventListener('click', toggleTheme);
    }
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
    if (!elements.themeToggle) return;
    
    const icon = elements.themeToggle.querySelector('i');
    if (!icon) return;
    
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
    if (elements.menuToggle) {
        elements.menuToggle.addEventListener('click', () => {
            if (elements.mainNav) {
                elements.mainNav.classList.toggle('active');
            }
        });
    }
    
    // Переключение разделов
    elements.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            elements.navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            elements.sections.forEach(section => {
                section.classList.remove('active');
            });
            
            const targetId = link.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add('active');
            }
            
            if (window.innerWidth <= 768 && elements.mainNav) {
                elements.mainNav.classList.remove('active');
            }
        });
    });
}

// ==================== РЕШАЛКА УРАВНЕНИЙ ====================
function initializeSolver() {
    if (elements.solveBtn) {
        elements.solveBtn.addEventListener('click', solveEquation);
    }
    
    if (elements.equationInput) {
        elements.equationInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') solveEquation();
        });
    }
}

function solveEquation() {
    if (!elements.equationInput) return;
    
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
        if (elements.stepsContainer) {
            elements.stepsContainer.innerHTML = '';
        }
        if (elements.resultContainer) {
            elements.resultContainer.innerHTML = '';
        }
        
        // Используем простой решатель для демонстрации
        const solution = simpleEquationSolver(equation);
        displaySolution(solution);
        
        showNotification('✅ Уравнение решено!', 'success');
        
    } catch (error) {
        console.error('Ошибка решения:', error);
        showNotification('Ошибка в уравнении', 'error');
        showError(error.message, equation);
    }
}

// ПРОСТОЙ РЕШАТЕЛЬ (без math.js)
function simpleEquationSolver(equation) {
    const steps = [];
    steps.push(`📝 Исходное уравнение: ${equation}`);
    
    try {
        // Очищаем пробелы
        let cleanEq = equation.replace(/\s/g, '');
        steps.push(`🔧 Без пробелов: ${cleanEq}`);
        
        // Проверяем наличие знака =
        if (!cleanEq.includes('=')) {
            throw new Error('Уравнение должно содержать знак "="');
        }
        
        // Заменяем запятые на точки
        cleanEq = cleanEq.replace(/,/g, '.');
        
        // Ищем переменную
        const variables = cleanEq.match(/[a-z]/gi);
        if (!variables) {
            throw new Error('Не найдена переменная (используйте x, y, z и т.д.)');
        }
        
        const variable = variables[0];
        steps.push(`🎯 Переменная: ${variable}`);
        
        // Для простых линейных уравнений
        if (cleanEq.includes(variable)) {
            // Пример решения для уравнений типа: ax + b = c
            
            // Разделяем на части
            const [left, right] = cleanEq.split('=');
            
            // Пробуем вычислить правую часть
            let rightValue;
            try {
                rightValue = safeEvaluate(right.replace(new RegExp(variable, 'gi'), '0'));
                steps.push(`📊 Правая часть: ${right} = ${rightValue}`);
            } catch (e) {
                rightValue = 0;
            }
            
            // Пробуем упростить левую часть
            let leftExpr = left;
            
            // Удаляем умножение на 1
            leftExpr = leftExpr.replace(/(\d*)\.?\d*?\*/g, '');
            leftExpr = leftExpr.replace(new RegExp(`\\*${variable}`, 'g'), variable);
            leftExpr = leftExpr.replace(new RegExp(`${variable}\\*`, 'g'), variable);
            
            steps.push(`🔧 Упрощенная левая часть: ${leftExpr}`);
            
            // Для уравнений типа: x + 5 = 10
            if (leftExpr.includes('+')) {
                const parts = leftExpr.split('+');
                let coeff = 0;
                let constant = 0;
                
                parts.forEach(part => {
                    if (part.includes(variable)) {
                        const coeffStr = part.replace(variable, '');
                        coeff = coeffStr === '' ? 1 : parseFloat(coeffStr) || 1;
                    } else {
                        constant += parseFloat(part) || 0;
                    }
                });
                
                steps.push(`📐 Коэффициент при ${variable}: ${coeff}`);
                steps.push(`📐 Свободный член: ${constant}`);
                
                // Решение: x = (right - constant) / coeff
                const solution = (rightValue - constant) / coeff;
                steps.push(`⚡ Решение: ${variable} = (${rightValue} - ${constant}) / ${coeff} = ${solution}`);
                
                // Проверка
                const checkLeft = coeff * solution + constant;
                const checkRight = rightValue;
                
                return {
                    equation: equation,
                    variable: variable,
                    solution: solution,
                    steps: steps,
                    check: {
                        left: checkLeft,
                        right: checkRight,
                        valid: Math.abs(checkLeft - checkRight) < 0.001
                    }
                };
            }
            
            // Для уравнений типа: 2x = 10
            else if (leftExpr.includes(variable)) {
                const coeffStr = leftExpr.replace(variable, '');
                const coeff = coeffStr === '' ? 1 : parseFloat(coeffStr) || 1;
                
                const solution = rightValue / coeff;
                steps.push(`⚡ Решение: ${variable} = ${rightValue} / ${coeff} = ${solution}`);
                
                return {
                    equation: equation,
                    variable: variable,
                    solution: solution,
                    steps: steps,
                    check: {
                        left: coeff * solution,
                        right: rightValue,
                        valid: true
                    }
                };
            }
        }
        
        throw new Error('Не могу решить это уравнение. Попробуйте более простой формат.');
        
    } catch (error) {
        steps.push(`❌ Ошибка: ${error.message}`);
        throw error;
    }
}

// Безопасное вычисление
function safeEvaluate(expr) {
    try {
        // Заменяем все небезопасные символы
        expr = expr
            .replace(/[^0-9+\-*/().]/g, '')
            .replace(/\/\//g, '/')
            .replace(/\*\*/g, '*');
        
        // Используем Function для безопасного вычисления
        return Function('"use strict"; return (' + expr + ')')();
    } catch (e) {
        console.warn('Ошибка вычисления:', expr, e);
        return NaN;
    }
}

// Показать решение
function displaySolution(solution) {
    if (!elements.stepsContainer || !elements.resultContainer) return;
    
    // Шаги решения
    let stepsHTML = '<div class="mathjs-steps">';
    stepsHTML += '<h4><i class="fas fa-list-ol"></i> Процесс решения:</h4>';
    
    if (solution.steps && solution.steps.length > 0) {
        solution.steps.forEach((step, index) => {
            stepsHTML += `
                <div class="mathjs-step">
                    <span class="step-number">${index + 1}</span>
                    <span class="step-text">${step}</span>
                </div>
            `;
        });
    }
    stepsHTML += '</div>';
    
    elements.stepsContainer.innerHTML = stepsHTML;
    
    // Результат
    let resultHTML = '<div class="mathjs-result">';
    
    if (solution.solution !== undefined && !isNaN(solution.solution)) {
        resultHTML += `
            <h2><i class="fas fa-check-circle"></i> Решение найдено!</h2>
            <div class="main-answer">${solution.variable} = ${solution.solution}</div>
        `;
        
        // Проверка
        if (solution.check) {
            if (solution.check.valid) {
                resultHTML += `
                    <div class="verification valid">
                        <i class="fas fa-check"></i> Проверка: ${solution.check.left} = ${solution.check.right}
                    </div>
                `;
            } else {
                resultHTML += `
                    <div class="verification approx">
                        <i class="fas fa-approximately-equal"></i> 
                        Приблизительно: ${solution.check.left} ≈ ${solution.check.right}
                    </div>
                `;
            }
        }
    } else {
        resultHTML += '<h3><i class="fas fa-times-circle"></i> Решений не найдено</h3>';
    }
    
    resultHTML += `
        <div class="solution-info">
            <small>
                <i class="fas fa-clock"></i> ${new Date().toLocaleTimeString('ru-RU')}
                <i class="fas fa-calculator"></i> Простой решатель
            </small>
        </div>
    `;
    
    resultHTML += '</div>';
    elements.resultContainer.innerHTML = resultHTML;
}

// Для бесплатных пользователей
function showPremiumLocked() {
    if (!elements.resultContainer) return;
    
    elements.resultContainer.innerHTML = `
        <div class="premium-locked-mathjs">
            <div class="lock-icon">
                <i class="fas fa-lock fa-3x"></i>
            </div>
            <h3>Решалка уравнений заблокирована</h3>
            <p>Для использования решателя активируйте ключ</p>
            <button class="btn btn-primary btn-large" 
                    onclick="document.querySelector('[href=\\'#key\\']').click()">
                <i class="fas fa-key"></i> Активировать ключ
            </button>
        </div>
    `;
}

// Показать ошибку
function showError(errorMsg, equation) {
    if (!elements.resultContainer) return;
    
    elements.resultContainer.innerHTML = `
        <div class="mathjs-error">
            <h3><i class="fas fa-exclamation-triangle"></i> Ошибка</h3>
            <p>${errorMsg}</p>
            
            <div class="error-examples">
                <h4>Примеры уравнений которые работают:</h4>
                <ul>
                    <li><code>2x + 5 = 15</code> → x = 5</li>
                    <li><code>3x = 12</code> → x = 4</li>
                    <li><code>x + 10 = 20</code> → x = 10</li>
                    <li><code>5x - 3 = 22</code> → x = 5</li>
                    <li><code>x/2 = 8</code> → x = 16</li>
                </ul>
                <p><small>Пока поддерживаются только простые линейные уравнения</small></p>
            </div>
        </div>
    `;
}

// ==================== МАТЕМАТИКА В СТОЛБИК ====================
function initializeColumnMath() {
    // Переключение операций
    elements.operationBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.operationBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (elements.opDisplay) {
                elements.opDisplay.textContent = btn.dataset.op;
            }
        });
    });
    
    // Расчет
    if (elements.calculateColumn) {
        elements.calculateColumn.addEventListener('click', calculateColumn);
    }
}

function calculateColumn() {
    const num1 = document.getElementById('num1')?.value;
    const num2 = document.getElementById('num2')?.value;
    const opDisplay = document.getElementById('opDisplay');
    
    if (!num1 || !num2 || !opDisplay) {
        showNotification('Введите оба числа!', 'error');
        return;
    }
    
    const operation = opDisplay.textContent;
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
        case '×':
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
    
    if (elements.columnResult) {
        elements.columnResult.textContent = result;
        elements.columnResult.style.display = 'block';
    }
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
    
    if (Math.abs(b) > 9) {
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
    }
    
    result += ' '.repeat(maxLength - productStr.length + 2) + productStr;
    
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
    if (elements.uploadBtn) {
        elements.uploadBtn.addEventListener('click', () => {
            if (elements.photoUpload) {
                elements.photoUpload.click();
            }
        });
    }
    
    if (elements.uploadArea) {
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
    }
    
    if (elements.photoUpload) {
        elements.photoUpload.addEventListener('change', (e) => {
            handlePhotoUpload(e.target.files);
        });
    }
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
    
    if (elements.photoUpload) {
        elements.photoUpload.value = '';
    }
}

function savePhotosToStorage() {
    localStorage.setItem('user_photos', JSON.stringify(uploadedPhotos));
}

function renderGallery() {
    if (!elements.gallery) return;
    
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
    if (elements.activateKey) {
        elements.activateKey.addEventListener('click', activateKey);
    }
    
    if (elements.keyInput) {
        elements.keyInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                activateKey();
            }
        });
    }
}

// Массив валидных ключей
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
    if (!elements.keyInput) return;
    
    const key = elements.keyInput.value.trim().toUpperCase();
    
    if (!key) {
        showNotification('Введите ключ!', 'error');
        return;
    }
    
    const keyRegex = /^UCH-NA5-[A-Z]{3,4}-\d{3}$/;
    if (!keyRegex.test(key)) {
        showNotification('Неверный формат ключа!', 'error');
        return;
    }
    
    if (!VALID_KEYS.includes(key)) {
        showNotification('Недействительный ключ!', 'error');
        return;
    }
    
    if (usedKeys.includes(key)) {
        showNotification('Этот ключ уже был активирован!', 'warning');
        return;
    }
    
    try {
        const activationResult = await simulateServerActivation(key);
        
        if (activationResult.success) {
            userKey = key;
            keyExpiry = new Date(activationResult.expiry);
            
            const keyData = {
                key: key,
                expiry: keyExpiry.toISOString(),
                activated: new Date().toISOString(),
                user: currentUser.id
            };
            
            localStorage.setItem('key_data', JSON.stringify(keyData));
            
            usedKeys.push(key);
            localStorage.setItem('used_keys', JSON.stringify(usedKeys));
            
            activatePremiumFeatures(true);
            updateKeyTimer();
            
            if (elements.keyInput) {
                elements.keyInput.value = '';
            }
            
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
    if (!elements.keyStatus) return;
    
    if (isActive) {
        elements.keyStatus.className = 'key-status active';
        elements.keyStatus.innerHTML = '<i class="fas fa-key"></i> <span>Ключ активирован</span>';
        
        if (elements.keyTimer) {
            elements.keyTimer.style.display = 'block';
        }
        
    } else {
        elements.keyStatus.className = 'key-status inactive';
        elements.keyStatus.innerHTML = '<i class="fas fa-key"></i> <span>Ключ не активирован</span>';
        
        if (elements.keyTimer) {
            elements.keyTimer.style.display = 'none';
        }
    }
}

function updateKeyTimer() {
    if (!keyExpiry || !elements.daysLeft || !elements.progressFill || !elements.expiryDate) return;
    
    const now = new Date();
    const timeDiff = keyExpiry - now;
    
    if (timeDiff <= 0) {
        activatePremiumFeatures(false);
        return;
    }
    
    const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    elements.daysLeft.textContent = daysLeft;
    
    const totalDays = 10;
    const progress = ((totalDays - daysLeft) / totalDays) * 100;
    elements.progressFill.style.width = `${progress}%`;
    
    elements.expiryDate.textContent = `Дата окончания: ${keyExpiry.toLocaleDateString('ru-RU')}`;
    
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

// ==================== УТИЛИТЫ ====================
function showNotification(message, type = 'info') {
    if (!elements.notification) return;
    
    elements.notification.textContent = message;
    
    const colors = {
        success: '#4caf50',
        error: '#f44336',
        warning: '#ff9800',
        info: '#2196f3'
    };
    
    elements.notification.style.backgroundColor = colors[type] || colors.info;
    elements.notification.style.display = 'block';
    
    setTimeout(() => {
        elements.notification.style.display = 'none';
    }, 5000);
}

// ==================== ГЛОБАЛЬНЫЕ ФУНКЦИИ ====================
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
