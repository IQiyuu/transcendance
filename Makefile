# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: ggiboury <ggiboury@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2025/04/22 15:00:40 by ggiboury          #+#    #+#              #
#    Updated: 2025/05/16 13:50:17 by ggiboury         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #


# Transcendence, a 42 project, done by dgoubin, romartin, ktaplin, ggiboury

# Variables
#
NAME	= trong

REQ	= $(VOLUME_WEBSITE_FILES) $(VOLUME_DATABASE_FILES) $(SSL_CERTIFICATE)

COMPOSE_FILE	= ./srcs/docker-compose.yml

# Getting all files in the repo
SCRIPTS	= $(shell cd srcs/services/fastify/src && find | cut -c2- )
ASSETS	= $(shell cd srcs/assets && find | cut -c2- )

SRCS			= $(SRCS_FASTIFY) $(SRCS_ASSETS) $(SRCS_DB)

#https://coolors.co/331832-694d75-1b5299
#https://coolors.co/a0ddff-053225-e34a6f
#https://coolors.co/0d0106-3626a7-657ed4

# Something to help
#https://github.com/microsoft/TypeScript-Node-Starter

# We should have done like this ... https://github.com/fastify/demo/

#Full path scripts and assets
SRCS_DIR		= ./srcs/
SRCS_FASTIFY	= $(SCRIPTS:%=$(SRCS_DIR)services/fastify/src%)
SRCS_CONFIG		= $(SCRIPTS:%=$(SRCS_DIR)services/fastify/src%)
SRCS_ASSETS		= $(ASSETS:%=$(SRCS_DIR)assets%)
SRCS_DB			= $(SRCS_DIR)services/sqlite/transcendence.db



# Setting up volumes

VOLUME	= /goinfre/$(USER)/pong/data
VOLUME_WEBSITE			= /goinfre/$(USER)/pong/data/fastify
VOLUME_WEBSITE_DIRS		= $(VOLUME_WEBSITE)/dist $(VOLUME_WEBSITE)/src $(VOLUME_WEBSITE)/dist/assets
VOLUME_DATABASE			= /goinfre/$(USER)/pong/data/sqlite

VOLUME_WEBSITE_SCRIPTS	:= $(SCRIPTS:%=$(VOLUME_WEBSITE)/src%)
VOLUME_WEBSITE_CONFIG	= package.json tsconfig.json
VOLUME_WEBSITE_CONFIG	:= $(VOLUME_WEBSITE_CONFIG:%=$(VOLUME_WEBSITE)/%)
VOLUME_WEBSITE_ASSETS	:= $(ASSETS:%=$(VOLUME_WEBSITE)/dist/assets%)

VOLUME_WEBSITE_FILES	:= $(VOLUME_WEBSITE_ASSETS) $(VOLUME_WEBSITE_SCRIPTS) $(VOLUME_WEBSITE_CONFIG)
VOLUME_DATABASE_FILES	:= $(VOLUME_DATABASE)/transcendence.db


# Secret

SECRETS	= ./srcs/secrets

SSL_CERTIFICATE	= ${SECRETS}ssl.crt $(SECRETS)ssl.key

# Rules
#

# test:
# 	@echo $(VOLUME_WEBSITE_CONFIG)
#	@echo $(SRCS_FASTIFY)
#	@echo $(SRCS_ASSETS)
#	@echo $(SRCS)

$(NAME): $(REQ)
	docker compose -f $(COMPOSE_FILE) up -d

all: $(NAME)

check: $(SRCS)

$(SECRETS):
	mkdir -p $(SECRETS)

$(SSL_CERTIFICATE) &: | $(SECRETS)
	@if [ -e ${SECRETS}/ssl.crt -a -e ${SECRETS}/ssl.key ] ; then \
		echo "SSL Certificate already there";\
	else \
		echo "Creating SSL certificate"; \
		openssl req -x509 -newkey rsa:4096 -keyout ssl.key -out ssl.crt -sha256 -days 30 -nodes -subj "/C=FR/ST=France/L=Mulhouse/O=pong/CN=none"; \
		mv ssl.crt ssl.key ./srcs/secrets/ ; \
	fi 

$(VOLUME) $(VOLUME_WEBSITE) $(VOLUME_WEBSITE_DIRS):
	mkdir -p $@

$(VOLUME_WEBSITE_SCRIPTS): $(VOLUME_WEBSITE)/src
	cp -r $(@:${VOLUME_WEBSITE}/src%=$(SRCS_DIR)services/fastify/src%) $@
	
$(VOLUME_WEBSITE_CONFIG): $(VOLUME_WEBSITE)
	cp $(@:${VOLUME_WEBSITE}%=$(SRCS_DIR)services/fastify/%) $@

$(VOLUME_WEBSITE_ASSETS): $(VOLUME_WEBSITE)/dist/assets
	cp -r $(@:${VOLUME_WEBSITE}/dist/assets%=$(SRCS_DIR)assets%) $@

$(VOLUME_DATABASE): | $(VOLUME)
	mkdir -p $(VOLUME_DATABASE)
	
$(VOLUME_DATABASE_FILES): | $(VOLUME_DATABASE)
	@cp $(SRCS_DB) $(VOLUME_DATABASE_FILES)

re : fclean $(NAME)

clean : down
	docker container prune -f

# docker image prune -af

fclean : clean
	rm -rf $(VOLUME)

down :
	docker compose -f $(COMPOSE_FILE) down -v


# DEV

echo:
	@echo $(ASSETS)
	@echo $(SRCS_FASTIFY)
	@echo $(SRCS_ASSETS)
	@echo $(VOLUME_WEBSITE_ASSETS)

logs:
	docker compose -f $(COMPOSE_FILE) logs

status :
	docker container ls -a
	docker image ls -a

info : logs status

infow : status
	docker compose -f $(COMPOSE_FILE) logs website

#Apply changes on the scripts
reload : 
	@echo "NOT WORKING"
#	cp -r ${SRCS_FASTIFY} ${VOLUME_WEBSITE}/src
#	docker compose -f $(COMPOSE_FILE) restart

.PHONY: re clean fclean down logs status info reload


#CONTENT OF ENV
# NODE_VERSION=latest
# DEV_ENV=dev

# PORT=3000

# #Services
# WEBSITE_SERVICE=fastify
# DB_SERVICE=sqlite
# MONITORING_SERVICE=prometheus
# MONITORING_VISUALISER_SERVICE=grafana

# WEBSITE_SERVICE_IMAGE=fastify
# MONITORING_SERVICE_IMAGE=prom/prometheus
# MONITORING_VISUALISER_SERVICE_IMAGE=grafana/grafana-oss

# # Locations
# SRCS=./services/

# VOLUME_DB=/goinfre/$USER/pong/data/sqlite/
# VOLUME_SCRIPTS=/goinfre/$USER/pong/data/fastify/

# # Volume in containers
# LOCATION_DB=/home/db/
# LOCATION_SCRIPTS=/home/fastify/

# # Secrets
# SECRETS=./secrets/

# SSL_CERTIFICATE=ssl.crt
# SSL_KEY=ssl.key


# #Config files

# SRCS_MONITORING_CONFIG=${SRCS}monitoring/prometheus.yml
# SRCS_FASTIFY_CONFIG=${SRCS}fastify/package.json
# SRCS_FASTIFY_TSCONFIG=${SRCS}fastify/tsconfig.json