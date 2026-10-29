// Crops an image file to 3:4 (centre) and scales it to 600×800 WebP, so
// covers look the same everywhere and upload small (well under 2MB).
const WIDTH = 600;
const HEIGHT = 800;

export const MAX_COVER_FILE_BYTES = 15 * 1024 * 1024;

export const prepareCover = (file) =>
  new Promise((resolve, reject) => {
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
      reject(new Error("Use a PNG, JPEG or WebP image"));
      return;
    }
    if (file.size > MAX_COVER_FILE_BYTES) {
      reject(new Error("Image must be smaller than 15MB"));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const target = WIDTH / HEIGHT;
      const source = img.width / img.height;
      // Largest centred 3:4 window inside the source image.
      const sw = source > target ? img.height * target : img.width;
      const sh = source > target ? img.height : img.width / target;
      const sx = (img.width - sw) / 2;
      const sy = (img.height - sh) / 2;

      const canvas = document.createElement("canvas");
      canvas.width = WIDTH;
      canvas.height = HEIGHT;
      canvas.getContext("2d").drawImage(img, sx, sy, sw, sh, 0, 0, WIDTH, HEIGHT);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/webp", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't read that image"));
    };
    img.src = url;
  });
