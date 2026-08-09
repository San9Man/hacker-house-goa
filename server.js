const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')

const root = __dirname
const port = Number(process.env.PORT || 3000)
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
}

http.createServer((request, response) => {
  const requested = decodeURIComponent(request.url.split('?')[0])
  const relative = requested === '/' ? '/index.html' : requested
  const filePath = path.resolve(root, `.${relative}`)

  if (!filePath.startsWith(root + path.sep)) {
    response.writeHead(403)
    response.end('Forbidden')
    return
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(error.code === 'ENOENT' ? 404 : 500, {
        'Content-Type': 'text/plain; charset=utf-8',
      })
      response.end(error.code === 'ENOENT' ? 'Not found' : 'Server error')
      return
    }

    response.writeHead(200, {
      'Content-Type': types[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    })
    response.end(content)
  })
}).listen(port, '0.0.0.0', () => {
  console.log(`[server] listening on ${port}`)
})
