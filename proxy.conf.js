module.exports = {
  '/api': {
    target: 'http://localhost:8080',
    secure: false,
    configure: proxy => proxy.on('proxyReq', proxyRequest => proxyRequest.removeHeader('origin'))
  }
};
