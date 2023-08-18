const config = {
  REDIRECT_URI: 'REPLACE_WITH_YOUR_REDIRECT_URI', // i.e http://localhost:3000, https://serverName/lf-sample  Register both REDIRECT_URL and REDIRECT_URI/login.html in devconsole
  CLIENT_ID: 'REPLACE_WITH_YOUR_CLIENT_ID',
  HOST_NAME: 'laserfiche.com', // only update this if you are using a different environment (i.e. a.clouddev.laserfiche.com)
  SCOPE: 'repository.Read repository.Write', // Scope(s) requested by the app
};

export default config;
