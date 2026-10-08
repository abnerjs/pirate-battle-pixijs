/* eslint-disable */
/* tslint:disable */
/**
 * Mock Service Worker (2.15.0).
 * @see https://github.com/mswjs/msw
 */

const PACKAGE_NAME = 'msw'
const INTEGRITY_CHECKSUM = '2501a3511119c40dbfa47e923e3ec716'
const IS_MOCKED_RESPONSE = Symbol('is_mocked_response')
const activeClientIds = new Set()

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('message', async (event) => {
  const clientId = event.source.id

  if (!clientId) {
    return
  }

  const client = await self.clients.get(clientId)

  if (!client) {
    return
  }

  const allClients = await self.clients.matchAll({
    type: 'window',
  })

  switch (event.data) {
    case 'KEEPALIVE_REQUEST': {
      sendToClient(client, {
        type: 'KEEPALIVE_RESPONSE',
      })
      break
    }

    case 'INTEGRITY_CHECK_REQUEST': {
      sendToClient(client, {
        type: 'INTEGRITY_CHECK_RESPONSE',
        payload: {
          package: PACKAGE_NAME,
          checksum: INTEGRITY_CHECKSUM,
        },
      })
      break
    }

    case 'MOCK_ACTIVATE': {
      activeClientIds.add(clientId)

      sendToClient(client, {
        type: 'MOCKING_ENABLED',
        payload: true,
      })
      break
    }

    case 'MOCK_DEACTIVATE': {
      activeClientIds.delete(clientId)

      sendToClient(client, {
        type: 'MOCKING_ENABLED',
        payload: false,
      })
      break
    }

    case 'CLIENT_CLOSED': {
      activeClientIds.delete(clientId)

      const remainingClients = allClients.filter((client) => {
        return client.id !== clientId
      })

      if (remainingClients.length === 0) {
        activeClientIds.clear()
      }
      break
    }
  }
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.mode === 'navigate') {
    return
  }

  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') {
    return
  }

  if (activeClientIds.size === 0) {
    return
  }

  const requestId = crypto.randomUUID()

  event.respondWith(
    handleRequest(event, requestId).catch((error) => {
      if (error.name === 'NetworkError') {
        return
      }
      console.error(
        '[MSW] Failed to mock a "%s" request to "%s": %s',
        request.method,
        request.url,
        error,
      )
    }),
  )
})

async function handleRequest(event, requestId) {
  const client = await resolveMainClient(event)
  const response = await getResponse(event, client, requestId)

  if (response.type === 'passthrough') {
    return fetch(event.request)
  }

  if (response.type === 'error') {
    return Response.error()
  }

  return response
}

async function resolveMainClient(event) {
  const client = await self.clients.get(event.clientId)

  if (client?.frameType === 'top-level') {
    return client
  }

  const allClients = await self.clients.matchAll({
    type: 'window',
  })

  return allClients
    .filter((client) => {
      return client.visibilityState === 'visible'
    })
    .find((client) => {
      return activeClientIds.has(client.id)
    })
}

async function getResponse(event, client, requestId) {
  const { request } = event
  const clonedRequest = request.clone()

  function sendToClient(client, message) {
    return new Promise((resolve, reject) => {
      const channel = new MessageChannel()

      channel.port1.onmessage = (event) => {
        if (event.data && event.data.error) {
          return reject(event.data.error)
        }

        resolve(event.data)
      }

      client.postMessage(message, [channel.port2])
    })
  }

  const clientResponse = await sendToClient(client, {
    type: 'REQUEST',
    payload: {
      id: requestId,
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      cache: request.cache,
      mode: request.mode,
      credentials: request.credentials,
      destination: request.destination,
      integrity: request.integrity,
      redirect: request.redirect,
      referrer: request.referrer,
      referrerPolicy: request.referrerPolicy,
      body: await request.arrayBuffer(),
    },
  })

  if (!clientResponse) {
    return { type: 'passthrough' }
  }

  if (clientResponse.type === 'MOCK_RESPONSE') {
    const { status, statusText, headers, body } = clientResponse.payload
    const responseHeaders = new Headers(headers)

    return new Response(body, {
      status,
      statusText,
      headers: responseHeaders,
    })
  }

  if (clientResponse.type === 'MOCK_NOT_FOUND') {
    return { type: 'passthrough' }
  }

  if (clientResponse.type === 'NETWORK_ERROR') {
    return { type: 'error' }
  }

  return { type: 'passthrough' }
}

function sendToClient(client, message) {
  client.postMessage(message)
}
