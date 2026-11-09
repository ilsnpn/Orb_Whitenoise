// L'adresse d'origine de l'app (« /prelude ») renvoie vers l'accueil « / ».
/** @type {import('next').NextConfig} */
export default {
  async redirects() {
    return [{ source: '/prelude', destination: '/', permanent: false }];
  },
};
