import http.server
import socketserver
import os
import socket

PORT = 8088
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Enable CORS and disable aggressive caching for seamless updates
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

if __name__ == "__main__":
    local_ip = get_local_ip()
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
        print("=" * 65)
        print("  🏢 BERKELEY KPI AGENT - PORTAL RUNNING")
        print(f"  👉 Local URL:           http://localhost:{PORT}")
        print(f"  🌐 Network / Share URL: http://{local_ip}:{PORT}")
        print("=" * 65)
        print("  To share publicly over the internet, you can run in a separate terminal:")
        print(f"    ssh -R 80:localhost:{PORT} localhost.run")
        print(f"    OR: npx localtunnel --port {PORT}")
        print("=" * 65)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
