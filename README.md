# Word Hunt Online

A clone of Game Pigeon's WordHunt (a form of Boggle) for the [GameJay Telegram bot gaming platform](https://github.com/gabeklavans/gamejay-bot).

---

## To Develop

See the [GameJay README](https://github.com/gabeklavans/gamejay-bot#readme) for details on the API flow.

### Environment

 - Should run on the latest LTS `node` version (if it doesn't, please update and make a PR!)
 - [Snowpack](https://www.snowpack.dev/) is used to bundle the site for deployment and also spin up a development server. It is included in the `devDependencies`
 - As of now, there's no machine-specific `.env` file, but there is a `src/env.ts` with configurable variables
   - `SERVER_URL` should point to the backend GameJay server you want to use, either local or remote

Install npm packages
```sh
npm i
```

### Development Server

```sh
npm run dev
```

### Deploy

Output the website's files for deployment to the `_build` folder.
```sh
npm run build
```
