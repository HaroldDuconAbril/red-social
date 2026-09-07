// src/context/AuthContext.jsx
import {createContext,useState,useEffect}from 'react';

export const AuthContext=createContext();

export const AuthProvider=({children})=>{
  const [user,setUser]=useState(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    const token=localStorage.getItem('token');
    const savedUser=localStorage.getItem('user');

    if(token&&savedUser){
      try{
        const parsedUser=JSON.parse(savedUser);
        setUser({...parsedUser,token});
      }catch(error){
        console.error('Error al leer el usuario guardado:',error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
    }

    setLoading(false);
  },[]);

  const login=(data)=>{
    const token=data.token;
    const userData=data.user||data;

    if(!token){
      console.error('No se recibió token en login:',data);
      return;
    }

    const completeUser={...userData,token};

    localStorage.setItem('token',token);
    localStorage.setItem('user',JSON.stringify(userData));
    setUser(completeUser);
  };

  const logout=()=>{
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return(
    <AuthContext.Provider value={{user,login,logout,loading}}>
      {children}
    </AuthContext.Provider>
  );
};