/**
 * apiClient
 * Pequeno wrapper sobre fetch con manejo JSON y errores uniformes
 */
(function() {
  'use strict';

  const parseJson = async (response) => {
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return null;
    }
    try {
      return await response.json();
    } catch (error) {
      return null;
    }
  };

  const buildError = (message, response, payload) => {
    const error = new Error(message || 'Solicitud fallida');
    error.response = response;
    error.payload = payload;
    return error;
  };

  const request = async (url, options = {}) => {
    const {
      method = 'GET',
      headers = {},
      body,
      query
    } = options;

    const targetUrl = new URL(url, window.location.origin);
    if (query && typeof query === 'object') {
      Object.entries(query).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
          return;
        }
        targetUrl.searchParams.set(key, value);
      });
    }

    const finalHeaders = {
      Accept: 'application/json',
      ...headers
    };

    const init = { method, headers: finalHeaders };

    if (body !== undefined) {
      if (typeof body === 'string') {
        init.body = body;
      } else {
        init.body = JSON.stringify(body);
        if (!init.headers['Content-Type']) {
          init.headers['Content-Type'] = 'application/json';
        }
      }
    }

    const response = await fetch(targetUrl.toString(), init);
    const payload = await parseJson(response);

    if (!response.ok) {
      throw buildError(
        (payload && (payload.error || payload.message)) || response.statusText || 'Error de API',
        response,
        payload
      );
    }

    return payload;
  };

  const apiClient = {
    get: (url, options) => request(url, { ...options, method: 'GET' }),
    post: (url, body, options) => request(url, { ...options, method: 'POST', body }),
    put: (url, body, options) => request(url, { ...options, method: 'PUT', body }),
    delete: (url, options) => request(url, { ...options, method: 'DELETE' })
  };

  window.apiClient = apiClient;
})();
