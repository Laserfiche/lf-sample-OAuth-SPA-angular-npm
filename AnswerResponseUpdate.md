### Response

Hi! We are really happy to see people playing with these components.
Authentication via OAuth/ACS within an iframe is not allowed for security reasons. However, you can show the Laserfiche sign in page on a browser popup. 

We have added an example of this scenario to [our sample application on GitHub](https://github.com/Laserfiche/lf-sample-OAuth-SPA-angular-npm). Here we demonstrate both the ability to sign in via redirect as before, and also through a popup window. There is a dropdown that allows you to switch between `Sign In with redirect` and `Sign In with popup`. 

#### Look at code in these files for reference
 * app.component.ts
 * app.component.html
 * app.component.css
 * static-assets/login.html
 * config.ts
 * app.module.ts (added MatSelectModule import)

#### A few of things to note. 
 * The button that opens the popup (Sign In with popup), opens a popup browser window, pointing to a static html page (login.html), that is in the `/static-assets` folder.  You could also do this using Angular routing, we chose to simplify the example by just using a static page.
 * When the pop up is launched, we initiate the login flow automatically if logged out, so the user doesn't have to click the button again in the popup. We use the `initLogoutFlowAsync` function on the login component as soon as the page is launched, hiding the button to reduce confusion. This button along with the `<lf-login>` component it belongs to are added dynamically via `document.body.appendChild`. This is to ensure that when the EventListeners are added, the `<lf-login>` component contains the necessary attributes `client_id, redirect_uri, scope` etc. If you were to just have the component on the page, the component may have some of these attributes, (`cliend_id, redirect_uri`) as undefined, causing the component to emit a `LogoutCompleted` event that prematurely closes the window.
 * There is an event handler on the `loginCompleted` event for the `<lf-login>` component in login.html in order to close the dialog and return to the SPA.
 * There is also a hidden `<lf-login>` component on the main SPA page when signing in via popup. This is because once you login in the popup, the `<lf-login>` in the SPA will also change state to `LoggedIn` and have access to the accessToken. We use that state to hide/show the rest of the page.
 * We do not currently have an `initLogoutFlowAsync`, but used a workaround by calling the `.click()` event of the button on the `<lf-login>` component in `login.html` when the page is launched, so the user doesn't have to click a second button. We are looking at implementing the `initLogoutFlowAsync` function so that we do not have to use this workaround.

 * Note: `config.ts` now also has a `REDIRECT_URI_POPUP` field in order to login from within the popup. Check for comments in this file for instructions on structure of this link. Note that running `npm run build` and other analogous commands will run a script to copy this file with a `.js` extension into the `/dist` folder for the `index.html` to have access to.
      * If you are using the direct redirect, you only need to register the REDIRECT_URI in devconsole
	  * if you are using the popup login, you need to register the REDIRECT_URI_POPUP in devconsole

#### Bugs
 * When Signed in, and you select `Sign In with popup`, and then select `Sign In with redirect`, the text for the `<lf-login>` button will show `Sign in` instead of `Sign out`, even though the state remains `LoggedIn`. The button color is grey reflecting that the current state is LoggedIn, but the text is not updated. Refreshing the page returns the text to being `Sign out` as expected. This is a bug that we are aware of and will be addressing in an update soon. 