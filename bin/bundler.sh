echo Bundler starting

node ./tools/layoutBundler main &
node ./tools/layoutBundler player &
node ./tools/layoutBundler editor &
node ./tools/layoutBundler threesixty &

wait

echo Bundler completed
