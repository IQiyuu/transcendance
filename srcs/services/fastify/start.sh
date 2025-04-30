#!/bin/bash

#A little script 

cd /home/fastify

shutdown(){
	echo "Shutting down the container"
	npm uninstall 2> err.txt
	exit
};

# Trap the SIGTERM signal and perform a graceful shutdown
trap shutdown SIGTERM


echo "Setting up website"
npm install

echo "Starting website"
npm start