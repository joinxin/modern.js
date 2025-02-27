Before getting started, you will need to install [Node.js](https://nodejs.org/), and ensure that your Node.js version is higher than 14.17.6. **We recommend using the LTS version of Node.js 16.**

You can check the currently used Node.js version with the following command:

```bash
node -v
# v16.19.1
```

If you do not have Node.js installed in your current environment, or the installed version is lower than 14.17.6, you can use [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm) to install the required version.

Here is an example of how to install the Node.js 16 LTS version via nvm:

```bash
# Install the long-term support version of Node.js 16
nvm install 16 --lts

# Make the newly installed Node.js 16 as the default version
nvm alias default 16

# Switch to the newly installed Node.js 16
nvm use 16
```

:::tip nvm and fnm
Both nvm and fnm are Node.js version management tools. Relatively speaking, nvm is more mature and stable, while fnm is implemented using Rust, which provides better performance than nvm.
:::
