const crypto = require('crypto');


const generateActivationToken = () => crypto.randomBytes(32).toString('hex');

const hashToken = (rawToken) =>
    crypto.createHash('sha256').update(rawToken).digest('hex');

const generateCsrfToken = () => crypto.randomBytes(24).toString('hex');

const safeCompare = (a, b) => {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
};

module.exports = {
    generateActivationToken,
    hashToken,
    generateCsrfToken,
    safeCompare
};