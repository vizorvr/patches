node ./browser/test/functional/run.js

RETVAL=$?

if [ -e $CI_BUILD_NUMBER.png ];
then
	scp $CI_BUILD_NUMBER.* ops@ex40.kschzt.com:/var/www/fail.vizor.lol/
	echo Screenshot	at http://fail.vizor.lol/$CI_BUILD_NUMBER.png
	echo Log	at http://fail.vizor.lol/$CI_BUILD_NUMBER.txt
fi

exit $RETVAL
