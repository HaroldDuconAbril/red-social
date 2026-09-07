// src/components/RegisterRequest.jsx
import {useState}from 'react';
import axios from 'axios';
import {Link}from 'react-router-dom';

const RegisterRequest=()=>{
  const [formData,setFormData]=useState({
    email:'',
    description:'',
    fullBodyPhoto:null,
    signPhoto:null
  });
  const [status,setStatus]=useState('');
  const [sending,setSending]=useState(false);

  const handleSubmit=async(e)=>{
    e.preventDefault();
    setStatus('Enviando...');
    setSending(true);

    if(!formData.email||!formData.description||!formData.fullBodyPhoto||!formData.signPhoto){
      setStatus('❌ Debes completar todos los campos.');
      setSending(false);
      return;
    }

    const data=new FormData();
    data.append('email',formData.email);
    data.append('user_description',formData.description);
    data.append('full_body_photo',formData.fullBodyPhoto);
    data.append('sign_photo',formData.signPhoto);

    try{
      const res=await axios.post('http://localhost:5000/api/verification/request',data);
      console.log('Respuesta del servidor:',res.data);
      setStatus('✅ Solicitud enviada correctamente. El administrador la revisará.');
      setFormData({
        email:'',
        description:'',
        fullBodyPhoto:null,
        signPhoto:null
      });
    }catch(error){
      console.error('Error al enviar solicitud:',error.response?.data||error.message);
      setStatus(error.response?.data?.error||'❌ Error al enviar. Verifica los datos.');
    }finally{
      setSending(false);
    }
  };

  return(
    <div className="relative min-h-screen flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-[#080B12]/80 backdrop-blur-sm z-0"/>
      <div className="relative z-10 w-full max-w-lg bg-[#0E1320]/90 backdrop-blur-md border border-white/10 shadow-2xl p-8 sm:p-10 rounded-3xl overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-700/30 rounded-full blur-3xl"/>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-red-600/20 rounded-full blur-3xl"/>
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-white text-center mb-8">Solicitud de Ingreso</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-400 text-sm font-bold mb-2">Correo electrónico</label>
              <input
                type="email"
                placeholder="tu@correo.com"
                value={formData.email}
                className="w-full bg-black/30 border border-white/10 text-white rounded-xl p-3 focus:outline-none focus:border-red-500 transition-colors"
                onChange={(e)=>setFormData({...formData,email:e.target.value})}
                required
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm font-bold mb-2">¿Qué buscas? Cuéntanos sobre ti</label>
              <textarea
                placeholder="Breve descripción para el administrador..."
                value={formData.description}
                className="w-full bg-black/30 border border-white/10 text-white rounded-xl p-3 h-24 focus:outline-none focus:border-red-500 transition-colors resize-none"
                onChange={(e)=>setFormData({...formData,description:e.target.value})}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm font-bold mb-2">Foto cuerpo entero</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e)=>setFormData({...formData,fullBodyPhoto:e.target.files[0]})}
                  required
                  className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-white/10 file:text-white hover:file:bg-white/20 transition-colors cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-bold mb-2">Foto con cartel Erotica</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e)=>setFormData({...formData,signPhoto:e.target.files[0]})}
                  required
                  className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-white/10 file:text-white hover:file:bg-white/20 transition-colors cursor-pointer"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-black px-6 py-3 rounded-xl transition-colors shadow-lg shadow-red-900/30 mt-4"
            >
              {sending?'Enviando...':'Enviar Solicitud'}
            </button>
          </form>

          {status&&(
            <div className={`mt-6 p-4 rounded-xl border text-center font-bold ${status.includes('✅')?'bg-green-900/30 border-green-500/30 text-green-400':'bg-red-900/30 border-red-500/30 text-red-400'}`}>
              {status}
            </div>
          )}

          <div className="mt-6 text-center border-t border-white/10 pt-6">
            <Link to="/" className="text-gray-500 hover:text-white text-sm font-bold transition-colors">
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterRequest;