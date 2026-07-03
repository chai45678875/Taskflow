// TaskFlow Service Worker (GitHub Pages 兼容版)
// 缓存策略：静态资源 Cache First，API Network First 回退缓存
// 注意：本文件为静态资源，路径均相对于 Service Worker 的 scope（/Taskflow/）

const CACHE_VERSION = 'taskflow-v2'
const STATIC_CACHE = `${CACHE_VERSION}-static`
const API_CACHE = `${CACHE_VERSION}-api`
const IMAGE_CACHE = `${CACHE_VERSION}-images`

// 需要预缓存的静态资源（路径相对于 SW scope）
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
]

// 判断是否为 API 请求（兼容 GitHub Pages 子目录）
function isApiRequest(url) {
  // 在静态模式下，前端不会发起 /api/ 请求；保留此逻辑以备启用后端时使用
  return url.pathname.includes('/api/')
}

// ====== 安装：预缓存静态资源 ======
self.addEventListener('install', (event) => {
  console.log('[SW] 安装中...')
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] 预缓存静态资源')
      return cache.addAll(PRECACHE_URLS)
    }).then(() => {
      return self.skipWaiting()
    })
  )
})

// ====== 激活：清理旧缓存 ======
self.addEventListener('activate', (event) => {
  console.log('[SW] 激活中...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name.startsWith('taskflow-') && 
                   name !== STATIC_CACHE && 
                   name !== API_CACHE && 
                   name !== IMAGE_CACHE
          })
          .map((name) => caches.delete(name))
      )
    }).then(() => {
      return self.clients.claim()
    })
  )
})

// ====== 请求拦截 ======
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // 跳过非 GET 请求
  if (request.method !== 'GET') {
    return
  }

  // 跳过 chrome-extension 等非 http(s) 请求
  if (!url.protocol.startsWith('http')) {
    return
  }

  // 跨域请求不拦截
  if (url.origin !== self.location.origin) {
    return
  }

  // ====== API 请求：Network First，回退缓存 ======
  if (isApiRequest(url)) {
    event.respondWith(networkFirstWithCache(request, API_CACHE))
    return
  }

  // ====== 图片/字体等资源：Cache First ======
  if (
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|eot)$/i)
  ) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE))
    return
  }

  // ====== JS/CSS/HTML 等静态资源：Cache First，后台更新 ======
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'document' ||
    url.pathname === self.location.pathname.replace(/sw\.js$/, '') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.html')
  ) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE))
    return
  }

  // ====== 默认：Network First ======
  event.respondWith(networkFirstWithCache(request, STATIC_CACHE))
})

// ====== 缓存策略函数 ======

// Cache First：优先从缓存读取，缓存未命中时请求网络
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) {
    return cached
  }
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch (err) {
    // 离线且无缓存，返回空
    return new Response('', { status: 408 })
  }
}

// Network First：优先请求网络，失败时回退缓存
async function networkFirstWithCache(request, cacheName) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch (err) {
    const cached = await caches.match(request)
    if (cached) {
      return cached
    }
    // API 离线且无缓存时，返回提示
    if (isApiRequest(new URL(request.url))) {
      return new Response(JSON.stringify({
        code: -1,
        message: '离线模式：数据不可用',
        offline: true
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    return new Response('离线模式', { status: 503 })
  }
}

// Stale While Revalidate：先返回缓存，同时后台更新缓存
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  }).catch(() => null)

  return cached || fetchPromise
}

// ====== 推送通知 ======
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  const options = {
    body: data.body || '有新的任务提醒',
    icon: './icon-192.png',
    badge: './icon-192.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'taskflow',
    data: { url: data.url || './' }
  }
  event.waitUntil(
    self.registration.showNotification(
      data.title || 'TaskFlow 提醒',
      options
    )
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url || './')
      }
    })
  )
})
