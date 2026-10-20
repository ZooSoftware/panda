// Saving files from the browser.

/** Saves a URL (object URL or data URL) under `name` through the browser's download. */
export function saveUrl(name: string, url: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
}

export function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  saveUrl(name, url);
  URL.revokeObjectURL(url);
}

/** A file-name-safe version of a title: "Learn Web Dev!" → "learn-web-dev". */
export function slug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'tree';
}
