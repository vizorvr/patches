# Instructions for running Vizor Patches locally using Windows
## Written by Maya Lekova

1. MongoDB
	1. Installation instructions can be found [here](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/).
1. Redis
	1. Download an installer for the [Windows version](https://github.com/MicrosoftArchive/redis) by Microsoft Open Tech group and follow the steps
	1. Check in "Services" that "Redis" is running. By default it runs on port *6379*
1. Node.js
	1. Install nvm-windows: [instructions](https://github.com/coreybutler/nvm-windows#node-version-manager-nvm-for-windows)
	1. `nvm install 6.11`
	1. `nvm use 6.11`
	1. Running `node -v` should give you "v6.11.x"
1. Graphicsmagick
	1. Download from the "windows" section of their [website](http://www.graphicsmagick.org/download.html). Q8 x64 version is suitable for setting up Patches.
	1. Open a new cmd window and ensure the installation is successful by running `gm help`
1. Additional setup for building the sse4_crc32 module *(optional)*
	1. Download and install [Python](https://www.python.org/downloads/release/python-2714/)
	1. Verify by opening new cmd and running `python --version`
	1. Install Visual Studio version lower than 2017 (with 2017 there's an [issue reported](https://github.com/anandsuresh/sse4_crc32/issues/65)). If the version is >2005 use the appropriate version of cmd to get it building.
1. Setting up the repo
	1. Download some nice Git client compatible with your version of Windows (personally I use [Git for Windows](http://gitforwindows.org/)) and clone the repo
	1. `npm install && npm install -g gulp`
	1. Few deprecated modules appear and (if no success in the previous step) sse4_crc32 may fail completely.

*Note about MongoDB:* For the server I use a cloud-hosted version on [mLab](https://mlab.com/). It provides 0.5GB of storage with MongoDB version 3.4.x. MongoDB server used to be easily installable on consumer versions of Windows, but now on their website there's only installer for Windows Server 2008. If you choose similar cloud provider, the connection string `mongodb://<user>:<pass>@<host>:<port>/<dbname>` should be set as an environment variable `MONGODB` prior to running patches and also some modifications in `gridfs-storage.js` are needed in order to support authentication.
