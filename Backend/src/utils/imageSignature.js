
const SIGNATURES = [
    { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
    { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }
    // WEBP se valida aparte más abajo porque no son bytes contiguos desde el inicio.
];

const matchesSignature = (buffer, bytes) =>
    buffer.length >= bytes.length && bytes.every((byte, i) => buffer[i] === byte);

const isWebp = (buffer) =>
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP';

// Devuelve el mime real detectado ('image/jpeg' | 'image/png' | 'image/webp')
// o null si el contenido no coincide con ninguno de los formatos permitidos.
const detectImageMime = (buffer) => {
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) return null;
    if (isWebp(buffer)) return 'image/webp';
    const match = SIGNATURES.find((sig) => matchesSignature(buffer, sig.bytes));
    return match ? match.mime : null;
};

module.exports = { detectImageMime };