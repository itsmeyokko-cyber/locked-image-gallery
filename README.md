# Locked Image Gallery — GitHub Pages version

This is the static GitHub Pages conversion of the original Express gallery.

## Password
The default password is `0016`.

## Add images
1. Put image files in `images/`.
2. Edit `images.json` so it contains an entry for every file, e.g.:
   ```json
   [
     {"name":"photo1.jpg"},
     {"name":"photo2.png"}
   ]
   ```
3. Commit the changes to GitHub.

## Important security limitation
GitHub Pages only serves static files. It cannot run the original Express server, sessions, protected image route, or upload/delete API. The password gate in this conversion is therefore client-side and is not a secure way to protect sensitive images. Images in a public repository are directly accessible.

For genuinely private images, use the original Node/Express app on a server host with persistent/private storage instead.
