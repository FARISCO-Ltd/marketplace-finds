const studioDb = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.publishableKey);
const canvas = document.getElementById('studio-canvas');
const ctx = canvas.getContext('2d');
const mediaInput = document.getElementById('studio-media');
const mediaHint = document.getElementById('media-hint');
const studioMessage = document.getElementById('studio-message');
let mode = 'images', images = [], video = null, exporting = false;

function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function lines(text, max, font) { ctx.font = font; const out = []; let line = ''; (text || '').split(/\s+/).forEach((word) => { const next = line ? `${line} ${word}` : word; if (ctx.measureText(next).width > max && line) { out.push(line); line = word; } else line = next; }); if (line) out.push(line); return out.slice(0, 2); }
function contain(media, x, y, w, h) { const sw = media.videoWidth || media.naturalWidth || 1, sh = media.videoHeight || media.naturalHeight || 1, s = Math.min(w / sw, h / sh), dw = sw * s, dh = sh * s; ctx.drawImage(media, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh); }
function asset(now) { return mode === 'video' ? video : images.length ? images[Math.floor(now / 2600) % images.length] : null; }
function value(id, fallback) { return document.getElementById(id).value || fallback; }

function render(now = performance.now()) {
  const bg = ctx.createLinearGradient(0, 0, 1080, 1920); bg.addColorStop(0, '#123e8d'); bg.addColorStop(.55, '#071d47'); bg.addColorStop(1, '#030c21'); ctx.fillStyle = bg; ctx.fillRect(0, 0, 1080, 1920);
  ctx.fillStyle = 'rgba(255,157,0,.13)'; ctx.beginPath(); ctx.arc(100, 1540 + Math.sin(now / 1900) * 35, 270, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = '800 38px Arial'; ctx.fillText('MARKETPLACE', 70, 92); ctx.fillStyle = '#ff9d00'; ctx.fillText('FINDS', 370, 92); ctx.fillStyle = 'rgba(255,255,255,.62)'; ctx.font = '600 23px Arial'; ctx.fillText('@farisco_ltd_2', 70, 132);
  rr(70, 190, 940, 910, 42); ctx.fillStyle = '#f9fafc'; ctx.fill(); ctx.save(); rr(70, 190, 940, 910, 42); ctx.clip();
  const item = asset(now); if (item && (item.complete || item.readyState >= 2)) contain(item, 100, 220, 880, 850); else { ctx.fillStyle = '#e7ebf1'; ctx.fillRect(70, 190, 940, 910); ctx.fillStyle = '#63708a'; ctx.font = '700 34px Arial'; ctx.textAlign = 'center'; ctx.fillText('Add your product image or video', 540, 650); ctx.textAlign = 'left'; } ctx.restore();
  rr(70, 1145, 940, 555, 38); ctx.fillStyle = 'rgba(255,255,255,.97)'; ctx.fill(); ctx.fillStyle = '#ff9d00'; ctx.font = '800 28px Arial'; ctx.fillText(value('studio-hook', 'A smart find for everyday life').toUpperCase(), 118, 1222);
  ctx.fillStyle = '#102552'; ctx.font = '800 68px Arial'; let y = 1310; lines(value('studio-title', 'Your Product'), 820, ctx.font).forEach((line) => { ctx.fillText(line, 118, y); y += 77; });
  ctx.fillStyle = '#526788'; ctx.font = '500 34px Arial'; lines(value('studio-benefit', 'Add one useful benefit here'), 800, ctx.font).forEach((line) => { ctx.fillText(line, 118, y); y += 42; });
  rr(118, 1580, 340, 78, 22); ctx.fillStyle = '#102552'; ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = '800 36px Arial'; ctx.fillText(value('studio-price', 'AED —'), 148, 1632); rr(650, 1580, 310, 78, 22); ctx.fillStyle = '#ff9d00'; ctx.fill(); ctx.fillStyle = '#071b43'; ctx.font = '800 27px Arial'; ctx.textAlign = 'center'; ctx.fillText(value('studio-cta', 'Find it on Amazon'), 805, 1630); ctx.fillStyle = 'rgba(255,255,255,.78)'; ctx.font = '600 25px Arial'; ctx.fillText('Trending finds, picked for you', 540, 1818); ctx.textAlign = 'left'; requestAnimationFrame(render);
}
function clearMedia() { images.forEach((x) => URL.revokeObjectURL(x.src)); images = []; if (video) URL.revokeObjectURL(video.src); video = null; }
function setMode(next) { mode = next; clearMedia(); mediaInput.value = ''; const isVideo = mode === 'video'; mediaInput.accept = isVideo ? 'video/mp4,video/webm,video/quicktime' : 'image/png,image/jpeg,image/webp'; mediaInput.multiple = !isVideo; mediaHint.textContent = isVideo ? 'Choose one product video' : 'Choose up to 5 images'; }
mediaInput.addEventListener('change', async () => { clearMedia(); const files = [...mediaInput.files]; if (!files.length) return; if (mode === 'video') { video = document.createElement('video'); video.src = URL.createObjectURL(files[0]); video.muted = true; video.loop = true; video.playsInline = true; await new Promise((done) => { video.onloadeddata = done; video.onerror = done; }); } else { images = (await Promise.all(files.slice(0, 5).map((file) => new Promise((done) => { const image = new Image(); image.src = URL.createObjectURL(file); image.onload = () => done(image); image.onerror = () => done(null); })))).filter(Boolean); } });
document.querySelectorAll('input[name="media-mode"]').forEach((el) => el.addEventListener('change', () => setMode(el.value)));
function download(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }
document.getElementById('download-image').addEventListener('click', () => canvas.toBlob((blob) => download(blob, 'marketplace-finds-cover.png'), 'image/png'));
document.getElementById('download-video').addEventListener('click', async () => { if (exporting) return; exporting = true; const button = document.getElementById('download-video'); button.disabled = true; button.textContent = 'Creating video…'; const recorder = new MediaRecorder(canvas.captureStream(30), { mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm', videoBitsPerSecond: 6000000 }); const chunks = []; recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data); recorder.onstop = () => { download(new Blob(chunks, { type: 'video/webm' }), 'marketplace-finds-tiktok-video.webm'); button.disabled = false; button.textContent = 'Download video'; exporting = false; studioMessage.style.color = '#257449'; studioMessage.textContent = 'Video downloaded. You can upload this WebM file to TikTok.'; }; if (video) { video.currentTime = 0; await video.play().catch(() => {}); } recorder.start(); setTimeout(() => { recorder.stop(); if (video) video.pause(); }, Number(document.getElementById('video-length').value) * 1000); });
document.getElementById('studio-sign-out').addEventListener('click', async () => { await studioDb.auth.signOut(); window.location.href = 'admin.html'; });
studioDb.auth.getSession().then(({ data: { session } }) => { if (!session) { window.location.href = 'admin.html'; return; } document.getElementById('studio-loading').hidden = true; document.getElementById('studio-shell').hidden = false; render(); });
