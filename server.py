import http.server
import socketserver
import os

PORT = 3000

class MyHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # If the request is for the root, serve index.html
        if self.path == '/':
            self.path = '/index.html'
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

# AI Studio requires the server to bind to 0.0.0.0
Handler = MyHandler

with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
    print(f"Server started at http://localhost:{PORT}")
    httpd.serve_forever()
