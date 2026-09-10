
const isProd = process.env.NODE_ENV === 'production';


const baseCookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge: 2 * 60 * 60 * 1000 // 2 horas, igual que la duración del JWT
};

const setSessionCookies = (res, { token, csrfToken }) => {
    res.cookie('token', token, baseCookieOptions);

    res.cookie('csrf_token', csrfToken, { ...baseCookieOptions, httpOnly: false });
};

const clearSessionCookies = (res) => {
    const clearOptions = { httpOnly: true, secure: isProd, sameSite: isProd ? 'none' : 'lax', path: '/' };
    res.clearCookie('token', clearOptions);
    res.clearCookie('csrf_token', { ...clearOptions, httpOnly: false });
};

module.exports = { setSessionCookies, clearSessionCookies };