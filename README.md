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
- Node 16 (LTS)
- all other Angular pre-reqs are in the local package.json

## First Time Setup

0. Clone the repo
1. Create a new Single Page App in devconsole for [US](https://app.laserfiche.com/devconsole/apps), [Canada](https://app.laserfiche.ca/devconsole/apps), or [Europe](https://app.eu.laserfiche.com/devconsole/apps) (depending on your region). This can also be accessed via the app picker in the top right when logged into your Laserfiche account.
    - Add the authentication redirect URI (e.g.: <https://myapp.example.com/lf-sample-app/>). This redirect URI in the devconsole must match the REDIRECT_URI variable in `src/app/config.js`, which must match the address on which you are hosting your application.
       - **Note: If you want to use the popup login as well, you must register the login page too (e.g. <https://myapp.example.com/lf-sample-app/popup-login.html>)
   - Select required scope(s) needed to read and write to the repository in the 'Authentication' tab  ("repository.Read" and "repository.Write" ). Scopes are case-sensitive and space-delimited. 
   - Note that in order to access the devconsole, your user account must have been given Developer Console Administrator Access Rights by an Account Administrator. Otherwise you will see a message along the lines of "You do not have permission to view the developer console."
2. Open folder (containing package.json) with Visual Studio Code
3. In `src/app/config.js` update the REDIRECT_URI and CLIENT_ID with the app client_id and redirect_uri as registered in step 1. You only need to update HOST_NAME if you are not using cloud production (laserfiche.com).
4. In VS Code, open a New Terminal window.
5. Run `npm install` in root folder. This command installs dependencies packages.
6. Run `ng build` in root folder. This command builds the project into `dist/` directory. See below for suggestions on how to host this folder.

## How to use `<lf-login>` component in your Sample app 
 - Build this application to look at our implementation of the `<lf-login>` component in a popup window. For detailed instructions of how to do this in your own SPA, read below. 
 - Add the file [`popup-login.html`](src/popup-login.html) to your project.
 - Configure [`app.component.ts`](src/app/app.component.ts) to open the `popup-login.html` in a new window when you want to initiate a Sign In or Sign Out. Refer to our implementation in this sample app for more details. 
 - Make sure that your built `dist` folder has the `config.js` file for the popup-html page to access configuration information. 
 - You can also write the `popup-login.html` page within your SPA using Angular, by implementing/adding the page to your routing. We wrote a static page for simplicity.
 - For security reasons, the ACS/OAuth sign in page has to use the top most level of the browser, so the component cannot be used in elements such as iframes. Further, using a Modal on top of the SPA will cause the application to redirect the entire browser window to adhere to ACS/OAuth rules.
 - Refer to this [Pull Request](https://github.com/Laserfiche/lf-sample-OAuth-SPA-angular-npm/pull/20) for an explanation on the changes.
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
