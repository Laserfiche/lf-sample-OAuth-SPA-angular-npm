# Laserfiche Sample App

This app showcases the use of the [Laserfiche UI Components library](https://developer.laserfiche.com) to build a single page application (SPA) that interacts with Laserfiche cloud repository using the REST Repository API.

This application uses the `<lf-login>` UI component to initiate an OAuth2 flow to authenticate the user. SPA OAuth2 applications must first be registered in the Laserfiche account devconsole as SPA.

This particular application is built using Angular and uses the npm package `@laserfiche/lf-ui-components`, which can only be used in an Angular project. If you would like to see examples of how to use the Laserfiche UI Components in any framework (Angular, Vue, React, no-framework, etc.), please see our other sample projects in [Angular](https://github.com/Laserfiche/lf-sample-OAuth-SPA-angular-cdn) and [React](https://github.com/Laserfiche/lf-sample-OAuth-SPA-react).


This project depends on the following libraries

- From NPM:
  - [@laserfiche/lf-js-utils](https://www.npmjs.com/package/@laserfiche/lf-js-utils)
  - [@laserfiche/lf-ui-components-services](https://www.npmjs.com/package/@laserfiche/lf-ui-components-services)
  - [@laserfiche/lf-ui-components](https://www.npmjs.com/package/@laserfiche/lf-ui-components)

## Contribution

We welcome contributions and feedback. Please follow our [contributing guidelines](./CONTRIBUTING.md).

## Pre-Requisites

- Visual Studio Code
- Node 14 (LTS)
- all other Angular pre-reqs are in the local package.json

## First Time Setup

1. Create a new Single Page App in [devconsole](https://app.laserfiche.com/devconsole/apps) and add the authentication redirect URI (e.g.: <https://myapp.example.com/lf-sample-app/>) which is also the root page of this app.
2. Open folder (containing package.json) with Visual Studio Code
3. In `src/app/app.component.ts` update the REDIRECT_URI and CLIENT_ID with the app client_id and redirect_uri as registered in step 1. You only need to update HOST_NAME if you are not using cloud production (laserfiche.com).
4. Update the REGIONAL_DOMAIN if you need are using a different environment (i.e. laserfiche.ca).
5. You can also specify which scope(s) you'd like for the authorization request using SCOPE. Scopes are case-sensitive and space-delimited (i.e. repository.Read). Scopes are optional when using v1 APIs but mandatory in v2. 
6. In VS Code, open a New Terminal window.
7. Run `npm install` in root folder. This command installs dependencies packages.
8. Run `ng build` in root folder. This command builds the project into `dist/` directory. See below for suggestions on how to host this folder.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Web Hosting

- This application should be hosted in a web server or CDN so that can be reached at URL: <https://myapp.example.com/lf-sample-app/>
- IMPORTANT security considerations: this application should not share HTTP origin (domain or subdomain) with other untrusted web pages to avoid leaking sensitive information such as Access Tokens via local store.
- On a Windows machine you can use IIS Service Manager and create a new web application or virtual directory to publish the `dist/` folder
- It is recommended to configure IIS website to use HTTPS and disable HTTP
- Browse to <https://myapp.example.com/lf-sample-app/> and sign-in

## Things to verify before creating a Pull Request

### Run tests

```sh
npm run test
```
