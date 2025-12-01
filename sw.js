// Service Worker для PWA
const CACHE_NAME = 'uchebana5-v1.0.0';
const OFFLINE_URL = '/index.html';

// Файлы для кэширования
const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/manifest.json',
    '/assets/icon-192.png',
    '/assets/icon-512.png'
];

// Установка Service Worker
self.addEventListener('install', event => {
    console.log('[Service Worker] Установка');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Кэшируем файлы');
                return cache.addAll(PRECACHE_URLS);
            })
            .then(() => {
                console.log('[Service Worker] Установка завершена');
                return self.skipWaiting();
            })
    );
});

// Активация Service Worker
self.addEventListener('activate', event => {
    console.log('[Service Worker] Активация');
    
    // Удаляем старые кэши
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Удаляем старый кэш:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[Service Worker] Активация завершена');
            return self.clients.claim();
        })
    );
});

// Перехват запросов
self.addEventListener('fetch', event => {
    // Пропускаем не-GET запросы
    if (event.request.method !== 'GET') return;
    
    // Пропускаем chrome-extension запросы
    if (event.request.url.startsWith('chrome-extension://')) return;
    
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Если есть в кэше - возвращаем
                if (response) {
                    return response;
                }
                
                // Иначе делаем сетевой запрос
                return fetch(event.request)
                    .then(response => {
                        // Проверяем валидный ответ
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Клонируем ответ
                        const responseToCache = response.clone();
                        
                        // Добавляем в кэш
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch(error => {
                        console.log('[Service Worker] Ошибка сети:', error);
                        
                        // Если запрос HTML страницы - показываем оффлайн страницу
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match(OFFLINE_URL);
                        }
                        
                        // Для других запросов можно вернуть заглушку
                        return new Response('Оффлайн режим', {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: new Headers({
                                'Content-Type': 'text/plain'
                            })
                        });
                    });
            })
    );
});

// Фоновая синхронизация (для будущих функций)
self.addEventListener('sync', event => {
    if (event.tag === 'sync-data') {
        console.log('[Service Worker] Фоновая синхронизация');
        event.waitUntil(syncData());
    }
});

async function syncData() {
    // Здесь можно синхронизировать данные с сервером
    // Например, отправку статистики или обновление ключей
    console.log('[Service Worker] Синхронизация данных');
}

// Получение push-уведомлений (для будущих функций)
self.addEventListener('push', event => {
    console.log('[Service Worker] Push уведомление получено');
    
    const title = 'УчебаНа5+';
    const options = {
        body: event.data.text(),
        icon: '/assets/icon-192.png',
        badge: '/assets/icon-192.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Открыть',
                icon: '/assets/icon-192.png'
            },
            {
                action: 'close',
                title: 'Закрыть',
                icon: '/assets/icon-192.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', event => {
    console.log('[Service Worker] Клик по уведомлению');
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});
