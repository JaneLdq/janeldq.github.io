# Jane's Home Page

Just a tiny static website with a few pages. 

---

## Involved Tools & Framework
* [npm](https://www.npmjs.com/)
* [Sass](https://sass-lang.com/)
* [Bootstrap](https://getbootstrap.com/)

## Folder Structure
```
- janeldq.github.io
  |- boostrap                       // bootstrap js & css files
  |- css                            // customized css file
    |- style.css                    // built from scss/style.css file
  |- images
  |- js                             // customized js files
  |- scss                           // scss files
    |- style.scss                   // this file imports all other scss files
    |- ...
```

## Development & Deploy

### Build CSS
All html files import only one css file `css/style.css`, so we need to build this file from scss files:
> npm run css:build

`css:build` is defined in `package.json`, based on a npm module [node-sass](https://www.npmjs.com/package/node-sass)
> node-sass scss/style.scss --output-style compressed -o dist css/style.css

### Local Development
For local development, we want live changes when updating scss files. To achieve this, we need to two npm modules:
* [node-sass](https://www.npmjs.com/package/node-sass)
* [live-server](https://www.npmjs.com/package/live-server)

#### Step 1 - Watch scss changes
`css:watch` is another script defined in `package.json`, it runs below command to watch scss changes:
> node-sass scss/style.scss -wo css

open a terminal and run command below:
> npm run css:watch

#### Step 2 - start a local live-reload web server
run commond below to install [live-server](https://www.npmjs.com/package/live-server)

> npm install -g live-server

start server in project root
> live-server

:ok_hand: Now, open the browser and we can see live changes on `localhost:8080`.

## References
* [*How to build a static website without frameworks using npm scripts*](https://wweb.dev/blog/how-to-create-static-website-npm-scripts/)