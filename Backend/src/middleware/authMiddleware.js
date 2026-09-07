// src/middleware/authMiddleware.js
const jwt=require('jsonwebtoken');

const verifyToken=(req,res,next)=>{
    const authHeader=req.headers.authorization||req.headers.Authorization;

    if(!authHeader||!authHeader.startsWith('Bearer ')){
        return res.status(403).json({error:'Acceso denegado. Se requiere un token de autenticación.'});
    }

    const token=authHeader.split(' ')[1];

    try{
        const decoded=jwt.verify(token,process.env.JWT_SECRET);

        req.user={
            ...decoded,
            id:decoded.id||decoded.userId||decoded.user_id
        };

        if(!req.user.id){
            return res.status(401).json({error:'Token válido, pero no contiene id de usuario.'});
        }

        next();
    }catch(error){
        return res.status(401).json({error:'Token inválido o expirado.'});
    }
};

module.exports=verifyToken;