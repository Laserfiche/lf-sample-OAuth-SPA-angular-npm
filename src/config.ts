const config = {
  REDIRECT_URI: 'REPLACE_WITH_YOUR_REDIRECT_URI', // i.e http://localhost:3000, https://serverName/lf-sample/index.html
  REDIRECT_URI_POPUP: 'REPLACE_WITH_YOUR_REDIRECT_URI', // i.e http://localhost:3000/static-assets/login.html, https://serverName/lf-sample/static-assets/login.html 
  CLIENT_ID: 'REPLACE_WITH_YOUR_CLIENT_ID',
  HOST_NAME: 'laserfiche.com', // only update this if you are using a different environment (i.e. a.clouddev.laserfiche.com)
  SCOPE: 'repository.Read repository.Write', // Scope(s) requested by the app
};

export default config;