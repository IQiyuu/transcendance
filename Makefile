# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: ggiboury <ggiboury@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2025/04/22 15:00:40 by ggiboury          #+#    #+#              #
#    Updated: 2025/04/27 22:45:25 by ggiboury         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #


# Transcendence, a 42 project, done by dgoubin, romartin, ktaplin, ggiboury

# Variables
#
NAME	= trong

REQ	= $(VOLUME_DATABASE_FILES) $(VOLUME_WEBSITE_FILES) $(SSL_CERTIFICATE)

COMPOSE_FILE	= ./srcs/docker-compose.yml

SCRIPTS	= $(shell cd srcs/services/fastify/src && find | cut -c2- )
#https://coolors.co/331832-694d75-1b5299
SRCS	= ./srcs/services/
SRCS_FASTIFY	= $(SCRIPTS:%=$(SRCS)%)
SRCS_DB	= $(SRCS)/sqlite/transcendence.db



VOLUME	= /home/ggiboury/goinfre/pong/data

VOLUME_WEBSITE	= /home/ggiboury/goinfre/pong/data/fastify
VOLUME_WEBSITE_DIRS	= $(VOLUME_WEBSITE)/dist $(VOLUME_WEBSITE)/src $(VOLUME_WEBSITE)/img
VOLUME_WEBSITE_FILES	:= $(SCRIPTS:%=$(VOLUME_WEBSITE)/src%)

VOLUME_DATABASE	= /home/ggiboury/goinfre/pong/data/sqlite
VOLUME_DATABASE_FILES	:= $(VOLUME_DATABASE)/transcendence.db

SECRETS	= ./srcs/secrets

SSL_CERTIFICATE	= ${SECRETS}ssl.crt $(SECRETS)ssl.key

# Rules
#
#https://coolors.co/a0ddff-053225-e34a6f
#https://coolors.co/0d0106-3626a7-657ed4
$(NAME): $(REQ)
	docker compose -f $(COMPOSE_FILE) up -d

all: $(NAME)

$(SECRETS):
	mkdir -p $(SECRETS)

$(SSL_CERTIFICATE) &: | $(SECRETS)
	@if [ -e ${SECRETS}/ssl.crt -a -e ${SECRETS}/ssl.key ] ; then \
		echo "SSL Certificate already there";\
	else \
		echo "Creating SSL certificate"; \
		openssl req -x509 -newkey rsa:4096 -keyout ssl.key -out ssl.crt -sha256 -days 30 -nodes -subj "/C=FR/ST=France/L=Mulhouse/O=pong/CN=none" ; \
		mv ssl.crt ssl.key ./srcs/secrets/ ; \
	fi 

# $(VOLUME):
# 	mkdir -p $(VOLUME)

$(VOLUME_WEBSITE): | $(VOLUME)
	mkdir -p $(VOLUME_WEBSITE)

$(VOLUME) $(VOLUME_WEBSITE_DIRS):
	mkdir -p $@

$(VOLUME_WEBSITE_FILES): $(VOLUME_WEBSITE)/src
	cp -r $(@:${VOLUME_WEBSITE}/src%=$(SRCS)fastify/src%) $@

$(VOLUME_DATABASE): | $(VOLUME)
	mkdir -p $(VOLUME_DATABASE)
	
$(VOLUME_DATABASE_FILES): | $(VOLUME_DATABASE)
	@echo "Importing database"
	@cp $(SRCS_DB) $(VOLUME_DATABASE_FILES)

re : down $(NAME)

clean : down
	docker container prune -f

# docker image prune -af

fclean : clean
	docker volume rm `(docker volume ls -q)`
	rm -rf $(VOLUME)

down :
	docker compose -f $(COMPOSE_FILE) down

logs:
	docker compose -f $(COMPOSE_FILE) logs

status :
	docker container ls -a
	docker image ls -a

info : logs status

infow : status
	docker compose -f $(COMPOSE_FILE) logs website

.PHONY: re clean fclean down logs status info ttt

