#!/bin/bash

#A little script 

cd /home/fastify

shutdown(){
	echo "Shutting down the container"
	npm uninstall
	exit
};

# Trap the SIGTERM signal and perform a graceful shutdown
trap shutdown SIGTERM


npm install
npm start