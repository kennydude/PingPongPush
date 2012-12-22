# PingPongPush

Ping this server and it'll pong out via GCM.

## SETUP

This "should" work for AppFog but you need to set the following environmental variables

* db - node-orm2 db string (unless you have an AppFog mysql-5.1 instancE)
* key - your GCM key
* VCAP_APP_PORT - change port (optional)

You also need to install the SQL from `setup.sql`

### Pushing to AppFog

Once you have created the app on AppFog, you will need to upload a version of PingPongPush.

You need to select a Node 0.8.8 repo and add a MySQL 5.1 instance.

Basically clone this repo, cd into it and run `af update appname`. It will fail to start because of the database most likely, don't worry and don't use it yet!

Then run `af tunnel` and tunnel into your MySQL instance and run the
commands in setup.sql except the CREATE DATABASE and SELECT ones.

Restart the app :)

## POST /ping

Arguments

* tags - comma seperated tags of data you want to push

Any other POST data will be sent along as extras

## POST /pong/register

Arguments

* gcm - GCM push ID
* tags - comma seperated tags you wish to join


