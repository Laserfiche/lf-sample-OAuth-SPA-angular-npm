# Laserfiche Sample App

This app showcases the use of the [Laserfiche UI Components library](https://developer.laserfiche.com) to build a single page application (SPA) that interacts with Laserfiche cloud repository using the REST Repository API.

This application uses the `<lf-login>` UI component to initiate an OAuth2 flow to authenticate the user. SPA OAuth2 applications must first be registered in the Laserfiche account devconsole as SPA.

This particular application is built using Angular, but Laserfiche UI Components are framework-agnostic and support other frameworks such as React.js, Vue, and no-framework HTML5.

This project depends on the following libraries

- From NPM:
  - [@laserfiche/lf-js-utils](https://www.npmjs.com/package/@laserfiche/lf-js-utils)
  - [@laserfiche/lf-ui-components-services](https://www.npmjs.com/package/@laserfiche/lf-ui-components-services)
  - [@laserfiche/types-lf-ui-components](https://www.npmjs.com/package/@laserfiche/types-lf-ui-components)
- From JSDelivr (via NPM)
  - [`<script src="https://cdn.jsdelivr.net/npm/@laserfiche/lf-ui-components@12.0.0/cdn/lf-ui-components.js" defer></script>`](https://cdn.jsdelivr.net/npm/@laserfiche/lf-ui-components@12.0.0/cdn/lf-ui-components.js)

## Contribution

We welcome contributions and feedback. Please follow our [contributing guidelines](./CONTRIBUTING.md).

## Pre-Requisites

- Visual Studio Code
- Node 14 (LTS)
- all other Angular pre-reqs are in the local package.json

## First Time Setup

1. Create a new Single Page App in [devconsole](https://app.a.clouddev.laserfiche.com/devconsole/apps) and add the authentication redirect URI (e.g.: <https://myapp.example.com/lf-sample-app/>) which is also the root page of this app.
2. Open folder (containing package.json) with Visual Studio Code
3. Update the `<lf-login>` in `src/app/app.component.html` with the app client_id and redirect_uri as registered in step 1.
4. In VS Code, open a New Terminal window.
5. Run `npm install` in root folder. This command installs dependencies packages.
6. Run `ng build` in root folder. This command builds the project into `dist/` directory.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Web Hosting

- This application should be hosted in a web server or CDN so that can be reached at URL: <https://myapp.example.com/lf-sample-app/>
- IMPORTANT security considerations: this application should not share HTTP origin (domain or subdomain) with other untrusted web pages to avoid leaking sensitive information such as Access Tokens via local store.
- On a Windows machine you can use IIS Service Manager and create a new web application or virtual directory to publish the `dist/` folder
- It is recommended to configure IIS website to use HTTPS and disable HTTP
- Browse to <https://myapp.example.com/lf-sample-app/> and sign-in

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).
