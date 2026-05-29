// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.

const config = {
  REDIRECT_URI: 'http://127.0.0.1:4200', // i.e http://localhost:3000, https://serverName/lf-sample  Register both REDIRECT_URL and REDIRECT_URI/login.html in devconsole
  CLIENT_ID: 'e89e9177-1910-4027-8eac-4e8691431505',
  HOST_NAME: 'laserfiche.com', // only update this if you are using a different environment (i.e. a.clouddev.laserfiche.com)
  SCOPE: 'repository.Read repository.Write', // Scope(s) requested by the app
};

export default config;
