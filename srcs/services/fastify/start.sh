#!/bin/bash

#A little script 

cd /home/fastify

shutdown(){
	echo "Shutting down the container"
	rm -rf /home/fastify/node_modules
	exit
};

# Trap the SIGTERM signal and perform a graceful shutdown
trap shutdown SIGTERM

echo "Setting up website"
npm install
npm run buildcss

cp src/server.js dist
cp -r src/routes dist

echo "Starting website"
npm start