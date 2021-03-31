# Photon Reddit ![LOGO](src/static/img/appIcons/favicon-32x32.png)

[![GPLv3 License](https://img.shields.io/badge/License-GPL%20v3-yellow.svg)](https://opensource.org/licenses/)

**Just replace [reddit.com/...](reddit.com) with [photon-reddit.com/...](https://photon-reddit.com) to get started!**

A clean and modern Reddit desktop web client.

Photon is a website to browse reddit without any distractions (no ads, no crowded sidebars, no distracting awards).

[r/photon_reddit](https://photon-reddit.com/r/photon_reddit) is the official subreddit.

# How it looks like

![preview image](readmeImg/photon_collection.jpg)

Discover all the features yourself on [photon-reddit.com/](https://photon-reddit.com)

# Prerequisites

- node: >= 14.x
- npm: >= 7.5.1

# Selfhosting

## Commands

### Download

```bash
git clone https://github.com/ArthurHeitmann/photon-reddit.git
cd photon-reddit
```

### Install dependencies & Build

```bash
npm install
npm run build
```

### Start

```bash
npm run start
```

### Other commands for development

```bash
# auto restart server when js files change
npm run start-dev
```

```bash
# watch for Typescript & Sass file changes and auto recompile
npm run watch-tsc
npm run watch-sass		# or watch-wsl2 for wsl support
```

## Getting Login to work

These steps are optional but helpful for development (needed if you want to log in).

Go [here](https://www.reddit.com/prefs/apps) and create your own reddit app.

1. Name: whatever you want

2. Select
> installed app

3. description & about url can be left empty

4. redirect uri: [yourDomain]/redirect

Examples:
- localhost:8080/redirect
- some-photon-reddit-fork.com/redirect

5. Under `/src/serverScripts/config.ts` change `redirectURI` to
```Javascript
export const rediretURI = "[what you entered in step 4.]";
```

## Environment Variables

Environment variables so far are only for the analytics system. If you use a .env file here is a template:

```
DB_HOST=
DB_USER=
DB_PW=
DB_PORT=
DB_DB=
analyticsPw=
```

`DB_x` is for configuring the mariaDB database. `analyticsPw` is for a cookie to access the analytics dashboard. 
More infos in `analyticsQueryMiddleware` in `src/serverScripts/analytics.ts`.   

# Technical

## Frontend

Just compiled Typescript & Sass, no other frameworks or libraries are (and for the most part should be) used.

Instead of using for example react components with jsx, a mix of the following is used:

```Typescript
// 1. For complicated components
export default class Ph_ComponentName extends HTMLElement  {
	// ...
}
customElements.define("ph-component-name", Ph_ComponentName);

const element = new Ph_ComponentName(args);
```
```Typescript
// 2. When a specific component needs to be stored
const element = document.createElement("div");
```
```Typescript
// 3. For writing a lot of elements at once
element.innerHTML = `
	<div class="${classNameVariable}">
		<span>...</span>
		...
	</div>
`;
```

### Structure

`/src/static` maps to `/` in the browser.

`/src/static/scripts/main.ts` is the entry point for the frontend Javascript.

`/src/static/style/main.scss` is the entry point for the css.

Custom html components are under `/src/static/scripts/components`

If a component has a custom style its _componentName.scss file lies in the components directory and is registered under `/src/static/style/_components.scss`

## Backend

An express server. Mostly only needed for making cross origin request for a client that otherwise get CORS blocked (mostly reddit api calls).

node 12.x is not supported because ES6 `import {} from "lib"` are used instead of `require("lib")`.

Also used for analytics purposes with MariaDB. Except for anonymized analytics data, no user data is stored.

## Naming conventions

In general `camelCase`. Except for custom html tag names then `ph-[kebab-case]`. Js component classes that extend HTMLElement `Ph_PascalCase`.

# Contributing

<sup><sup>I don't really know how this works :)</sup></sup>

Basically follow the instructions from [here](https://github.com/firstcontributions/first-contributions).

Before doing any major changes, first [ask me](#contact).

# Contact

See here: [photon-reddit.com/about](https://photon-reddit.com/about#contact)
