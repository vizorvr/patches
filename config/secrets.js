/**
 * IMPORTANT NOTICE
 *
 * You should never commit this file to a public repository on GitHub!
 * All public code on GitHub can be searched, that means anyone can see your
 * uploaded secrets.js file.
 *
 * I did it for your convenience using "throw away" credentials so that
 * all features could work out of the box.
 *
 * Untrack secrets.js from Git before pushing your code to GitHub:
 *
 * git rm --cached config/secrets.js
 *
 * If you have already commited this file to GitHub with your keys, then
 * refer to https://help.github.com/articles/remove-sensitive-data
*/

module.exports = {
  db: process.env.MONGODB|| 'mongodb://localhost:27017/test',
  sessionSecret: process.env.SESSION_SECRET || ', my Session Secr!t is Wv,xclzc jhut6 wtf psod lol'
};
