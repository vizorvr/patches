DEST=ops@ex40.kschzt.com:/var/www/fail.vizor.lol

node ./browser/test/functional/run.js

RETVAL=$?

echo EXITED $RETVAL

if [ -e "$CI_BUILD_NUMBER" ];
then
	ls -l $CI_BUILD_NUMBER
	scp -r $CI_BUILD_NUMBER $DEST/$CI_BUILD_NUMBER
	echo Artefacts at http://fail.vizor.lol/$CI_BUILD_NUMBER
fi

exit $RETVAL
