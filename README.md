# GitHub Pages Photo + Video Gallery

Upload photos into `images/` and videos into `videos/`.

Update `media.json` with every file you want displayed:

```json
[
  {"name":"photo1.jpg","type":"image"},
  {"name":"video1.mp4","type":"video"}
]
```

Supported images: JPG, JPEG, PNG, GIF, WEBP, BMP, AVIF.
Supported videos: MP4, WEBM, MOV, M4V, OGV.

GitHub Pages is static hosting. The password page is only a client-side gate and does not make files private in a public repository.
