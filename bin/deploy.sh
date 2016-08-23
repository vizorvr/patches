alias d='docker'

# source environment variables from local file
. ./env

if [ -e $FQDN ];
then
     echo "No environment?"
     exit 1
fi

echo ----------------------------------------
echo          Deploying $FQDN
echo ----------------------------------------

# update from git
git pull --rebase

# build docker container
d build -t $FQDN:v1 .

echo ----------------------------------------
echo          Destroying old $FQDN
echo ----------------------------------------

# destroy existing container
d stop $FQDN
d rm $FQDN

echo ----------------------------------------
echo          Provisioning $FQDN
echo ----------------------------------------

# run provisioning step
d run --rm \
	--link mongo:mongo \
	$FQDN:v1 \
	node ./node_modules/gulp/bin/gulp push

echo ----------------------------------------
echo          Running $FQDN
echo ----------------------------------------

# start container
d run -d --name $FQDN \
     -e "FQDN=$FQDN" \
     -e "KEY_SPARKPOST=$KEY_SPARKPOST" \
     -e "NODE_ENV=$NODE_ENV" \
     -e "NEWRELIC=$NEWRELIC" \
     -e "SESSION_SECRET=$SESSION_SECRET" \
     -e "ENGI_BIND_PORT=$PORT" \
     -e "KEY_MIXPANEL=$KEY_MIXPANEL" \
     -e "KEY_GTM=$KEY_GTM" \
     -e "WSS_HOST=$WSS_HOST" \
     -e "WSS_SECURE=$WSS_SECURE" \
     -p 127.0.0.1:$PORT:$PORT \
     --link mongo:mongo \
     --link redis:redis $FQDN:v1

