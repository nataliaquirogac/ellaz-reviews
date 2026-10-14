#!/usr/bin/env python3
"""Helper para el agente de aprobaciones de Ellaz Reviews.

  python3 ellaz_agent.py pending            -> lista JSON de reseñas "En Revisión"
  python3 ellaz_agent.py approve LOC NAME   -> aprueba (pasa a verde)

El PIN de admin se lee de ~/.ellaz-reviews-pin (no se guarda en el repo).
"""
import json, os, sys, urllib.request

API = "https://script.google.com/macros/s/AKfycbwDqUAkPU2-vTUaESRdRXUQTgOHQD7envZ_ixNVfmH1pQX_Lz8NLVHcWx08deaAdryJew/exec"
PIN_FILE = os.path.expanduser("~/.ellaz-reviews-pin")


def get():
    with urllib.request.urlopen(API, timeout=60) as r:
        return json.load(r)


def post(body):
    req = urllib.request.Request(API, data=json.dumps(body).encode(), headers={"Content-Type": "text/plain"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "pending":
        rows = [r for r in get()["rows"] if r["status"] == "revision"]
        print(json.dumps(rows, ensure_ascii=False, indent=1))
    elif cmd == "approve" and len(sys.argv) == 4:
        pin = open(PIN_FILE).read().strip()
        print(json.dumps(post({"action": "approve", "pin": pin, "loc": sys.argv[2], "name": sys.argv[3]}), ensure_ascii=False))
    else:
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
