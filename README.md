# PingPongPush

Ping this server and it'll pong out via GCM.

## SETUP

This "should" work for AppFog but you need to set the following environmental variables

* db - node-orm2 db string (unless you have an AppFog mysql-5.1 instancE)
* key - your GCM key
* VCAP_APP_PORT - change port (optional)

You also need to install the SQL from `setup.sql`

## POST /ping

Arguments

* tags - comma seperated tags of data you want to push

Any other POST data will be sent along as extras

## POST /pong/register

Arguments

* gcm - GCM push ID
* tags - comma seperated tags you wish to join


