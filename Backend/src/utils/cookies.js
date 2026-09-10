const isProd = process.env.NODE_ENV === 'production';


const baseCookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge: 2 * 60 * 60 * 1000 // 2 horas, igual que la duración del JWT
};


const setSessionCookie = (res, token) => {
    res.cookie('token', token, baseCookieOptions);
};

const clearSessionCookie = (res) => {
    res.clearCookie('token', { httpOnly: true, secure: isProd, sameSite: isProd ? 'none' : 'lax', path: '/' });
};

module.exports = { setSessionCookie, clearSessionCookie };