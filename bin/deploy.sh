alias d='sudo docker'

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
     -e "MANDRILL=$MANDRILL" \
     -e "NODE_ENV=$NODE_ENV" \
     -e "NEWRELIC=$NEWRELIC" \
     -e "SESSION_SECRET=$SESSION_SECRET" \
     -e "ENGI_BIND_PORT=$PORT" \
     -e "KEY_MIXPANEL=$KEY_MIXPANEL" \
     -e "KEY_GA=$KEY_GA" \
     -p 127.0.0.1:$PORT:$PORT \
     --link mongo:mongo \
     --link rethink:rethink $FQDN:v1

