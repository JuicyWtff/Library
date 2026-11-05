import json
import os
import re
import sqlite3
from collections import Counter

import numpy as np

RUTA_BASE = os.path.dirname(os.path.abspath(__file__))
RUTA_DB = os.path.join(RUTA_BASE, "books.db")
RUTA_SALIDA = os.path.join(RUTA_BASE, "data", "estadisticas.json")
PASO_HEAPS = 1000
PUNTOS_ZIPF = 300

STOPWORDS = {
    "a", "an", "the", "of", "in", "on", "at", "to", "for", "and", "or", "but",
    "is", "are", "was", "were", "be", "been", "being", "with", "by", "from",
    "as", "it", "this", "that", "these", "those", "his", "her", "its", "their",
    "our", "your", "my", "i", "you", "he", "she", "we", "they", "not", "no",
    "do", "does", "did", "has", "have", "had", "will", "would", "can", "could",
    "should", "about", "into", "than", "then", "so", "if", "up", "out", "over",
    "under", "again", "once", "here", "there", "when", "where", "why", "how",
    "all", "each", "few", "more", "most", "other", "some", "such", "only",
    "own", "same", "too", "very", "just", "now", "s", "t", "d", "ll", "m", "o"
}


def tokenizar(titulo):
    limpio = re.sub(r"[^a-z0-9\s]", "", titulo.lower())
    return limpio.split()


def lematizar(palabra):
    p = palabra

    if p.endswith("ies") and len(p) > 4:
        p = p[:-3] + "y"
    elif p.endswith("es") and len(p) > 4:
        p = p[:-2]
    elif p.endswith("s") and not p.endswith("ss") and len(p) > 3:
        p = p[:-1]

    if p.endswith("ing") and len(p) > 5:
        p = p[:-3]
    elif p.endswith("ed") and len(p) > 4:
        p = p[:-2]

    if p.endswith("ly") and len(p) > 4:
        p = p[:-2]

    return p


def muestrear_rangos(maximo, cantidad):
    rangos = np.unique(np.round(np.logspace(0, np.log10(maximo), cantidad)).astype(int))
    return [int(r) for r in rangos]


def main():
    conexion = sqlite3.connect(RUTA_DB)
    titulos = [fila[0] or "" for fila in conexion.execute("SELECT titulo FROM libros ORDER BY rowid")]
    conexion.close()

    conteo_sin = Counter()
    conteo_con = Counter()
    vocabulario = set()
    total_tokens = 0
    puntos_heaps = []

    for i, titulo in enumerate(titulos, start=1):
        tokens = tokenizar(titulo)
        conteo_sin.update(tokens)
        conteo_con.update(lematizar(t) for t in tokens if t not in STOPWORDS)
        vocabulario.update(tokens)
        total_tokens += len(tokens)
        if i % PASO_HEAPS == 0 or i == len(titulos):
            puntos_heaps.append((total_tokens, len(vocabulario)))

    ordenado_sin = conteo_sin.most_common()
    frecuencias_sin = [f for _, f in ordenado_sin]
    frecuencias_con = [f for _, f in conteo_con.most_common()]

    frecuencia_maxima = frecuencias_sin[0]
    puntos_zipf = []
    for r in muestrear_rangos(len(frecuencias_sin), PUNTOS_ZIPF):
        puntos_zipf.append({
            "rank": r,
            "sin": frecuencias_sin[r - 1],
            "con": frecuencias_con[r - 1] if r <= len(frecuencias_con) else None,
            "ideal": round(frecuencia_maxima / r, 2)
        })

    tope = min(1000, len(frecuencias_sin))
    x = np.log(np.arange(1, tope + 1))
    y = np.log(frecuencias_sin[:tope])
    pendiente, _ = np.polyfit(x, y, 1)
    exponente = -float(pendiente)

    n_vals = np.array([p[0] for p in puntos_heaps], dtype=float)
    v_vals = np.array([p[1] for p in puntos_heaps], dtype=float)
    beta, log_k = np.polyfit(np.log(n_vals), np.log(v_vals), 1)
    beta = float(beta)
    k = float(np.exp(log_k))

    puntos_heaps_salida = [
        {"n": int(n), "real": int(v), "ajuste": round(k * n ** beta, 2)}
        for n, v in puntos_heaps
    ]

    resultado = {
        "totales": {
            "libros": len(titulos),
            "tokens": total_tokens,
            "vocabulario_sin": len(conteo_sin),
            "vocabulario_con": len(conteo_con)
        },
        "zipf": {
            "puntos": puntos_zipf,
            "exponente": round(exponente, 3),
            "top": [{"palabra": p, "frecuencia": f} for p, f in ordenado_sin[:15]]
        },
        "heaps": {
            "puntos": puntos_heaps_salida,
            "k": round(k, 3),
            "beta": round(beta, 3)
        }
    }

    os.makedirs(os.path.dirname(RUTA_SALIDA), exist_ok=True)
    with open(RUTA_SALIDA, "w", encoding="utf-8") as archivo:
        json.dump(resultado, archivo, ensure_ascii=False)

    print(f"Libros: {len(titulos)}")
    print(f"Palabras totales: {total_tokens}")
    print(f"Vocabulario sin reduccion: {len(conteo_sin)}")
    print(f"Vocabulario con stopwords y lematizacion: {len(conteo_con)}")
    print(f"Zipf, exponente: {exponente:.3f}")
    print(f"Heaps, K: {k:.3f}, beta: {beta:.3f}")
    print(f"Guardado en {RUTA_SALIDA}")


main()