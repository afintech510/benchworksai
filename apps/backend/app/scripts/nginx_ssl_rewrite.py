#!/usr/bin/env python3
"""Rewrite /opt/hosthampton/nginx/nginx.conf to terminate HTTPS for
benchworksai.com hostnames using the Cloudflare origin cert at
/etc/ssl/benchworksai/. Idempotent.
"""
import re
import sys

PATH = '/opt/hosthampton/nginx/nginx.conf'

NEW_HTTPS_BLOCKS = '''  # HTTPS - BenchworksAI apex + www (marketing site -> larkintech-blue)
  server {
    listen 443 ssl;
    server_name benchworksai.com www.benchworksai.com;

    ssl_certificate     /etc/ssl/benchworksai/origin.pem;
    ssl_certificate_key /etc/ssl/benchworksai/origin.key;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    location / {
      set $lt http://larkintech-blue:3000;
      proxy_pass         $lt;
      proxy_http_version 1.1;
      proxy_set_header   Host $host;
      proxy_set_header   X-Real-IP $remote_addr;
      proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header   X-Forwarded-Proto $scheme;
      proxy_read_timeout 60s;
    }
  }

  # HTTPS - BenchworksAI ops dashboard
  server {
    listen 443 ssl;
    server_name app.benchworksai.com;

    ssl_certificate     /etc/ssl/benchworksai/origin.pem;
    ssl_certificate_key /etc/ssl/benchworksai/origin.key;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    location / {
      set $bw http://benchworks-outbound-caddy-1:80;
      proxy_pass       $bw;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
      proxy_read_timeout 60s;
    }
  }

  # HTTPS - n8n editor (websocket)
  server {
    listen 443 ssl;
    server_name n8n.benchworksai.com;

    ssl_certificate     /etc/ssl/benchworksai/origin.pem;
    ssl_certificate_key /etc/ssl/benchworksai/origin.key;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    location / {
      set $n8n http://benchworks-outbound-n8n-1:5678;
      proxy_pass       $n8n;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
      proxy_read_timeout 300s;
      proxy_buffering off;
    }
  }

'''

BENCH_HOSTS = ('benchworksai.com', 'www.benchworksai.com', 'app.benchworksai.com', 'n8n.benchworksai.com')


def remove_http_only_benchworks_blocks(text: str) -> str:
    """Strip any `server { listen 80; ... server_name <benchworks>; ... }` blocks
    (along with the comment line directly above them).
    """
    lines = text.split('\n')
    out: list[str] = []
    i = 0
    while i < len(lines):
        # Detect start of a server block (allow optional comment line above)
        comment_idx = -1
        if lines[i].lstrip().startswith('#') and 'benchworksai' in lines[i].lower() and 'HTTPS' not in lines[i]:
            comment_idx = i
            j = i + 1
            while j < len(lines) and lines[j].strip() == '':
                j += 1
        else:
            j = i

        if j < len(lines) and lines[j].lstrip().startswith('server {'):
            # Find closing brace via depth tracking
            depth = 0
            k = j
            while k < len(lines):
                depth += lines[k].count('{')
                depth -= lines[k].count('}')
                if depth == 0:
                    break
                k += 1
            block = '\n'.join(lines[j:k + 1])
            is_listen_80_only = 'listen 80;' in block and 'listen 443' not in block
            mentions_bench_host = any(re.search(r'server_name[^;]*\b' + re.escape(h) + r'\b', block) for h in BENCH_HOSTS)

            if is_listen_80_only and mentions_bench_host:
                # Skip comment + block + trailing blank lines
                i = k + 1
                while i < len(lines) and lines[i].strip() == '':
                    i += 1
                continue

        out.append(lines[i])
        i += 1
    return '\n'.join(out)


def add_hosts_to_redirect_block(text: str) -> str:
    """Add benchworks hostnames to the existing HTTP -> HTTPS redirect block
    (the one with `server_name staging.hosthampton.com ...`)."""
    pattern = re.compile(
        r'(server_name\s+staging\.hosthampton\.com[^;]*?)(;)',
        re.MULTILINE,
    )
    m = pattern.search(text)
    if not m:
        return text
    current = m.group(1)
    additions = [h for h in BENCH_HOSTS if h not in current]
    if not additions:
        return text
    new_server_name = current + ' ' + ' '.join(additions)
    return text[:m.start(1)] + new_server_name + m.group(2) + text[m.end(2):]


def insert_https_blocks(text: str) -> str:
    if 'server_name benchworksai.com www.benchworksai.com' in text and 'listen 443 ssl' in text:
        # Already inserted
        return text
    last_close = text.rfind('\n}')
    if last_close < 0:
        return text + '\n' + NEW_HTTPS_BLOCKS + '}\n'
    return text[:last_close] + '\n' + NEW_HTTPS_BLOCKS + text[last_close:]


def main():
    with open(PATH) as f:
        original = f.read()

    c = original
    c = remove_http_only_benchworks_blocks(c)
    c = add_hosts_to_redirect_block(c)
    c = insert_https_blocks(c)

    if c == original:
        print('no changes')
        sys.exit(0)

    with open(PATH, 'w') as f:
        f.write(c)
    print('rewritten')


if __name__ == '__main__':
    main()
