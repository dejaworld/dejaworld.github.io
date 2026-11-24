# DejaWorld project page

Static page of "DejaWorld: Scaling Action-Conditioned World Models through In-Context Dynamics Grounding".

- `index.html`: the page.
- `static/css`, `static/js`: style and behaviour (case tabs, video controls, BibTeX copy button).
- `static/images`, `static/videos`: figures and comparison clips.
- `static/paper/DejaWorld.pdf`: the paper, linked from the "Paper" button until the arXiv version is up.

## Local preview

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Then open `http://localhost:8000/`. Use Chrome or Firefox: this simple server does not answer range requests, which
Safari needs for video.

## Publishing

The page is served by GitHub Pages at <https://dejaworld.github.io> from the `main` branch of the public repository
`dejaworld/dejaworld.github.io`, which holds the current page only (one commit per published version).
