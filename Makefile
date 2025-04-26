# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: ggiboury <ggiboury@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2025/04/22 15:00:40 by ggiboury          #+#    #+#              #
#    Updated: 2025/04/26 16:21:27 by ggiboury         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #


# Transcendence, a 42 project, done by dgoubin, romartin, ktaplin, ggiboury

# Variables
#
NAME	= pong

REQ	= $(VOLUME_DATABASE) $(VOLUME_WEBSITE) $(SSL_CERTIFICATE)

COMPOSE_FILE	= ./srcs/docker-compose.yml

SRC_SCRIPTS	= $(shell find $$PWD/srcs/services/fastify/src) # Listing all scripts in the repo


VOLUME	= /home/ggiboury/goinfre/pong/data
VOLUME_WEBSITE	= /home/ggiboury/goinfre/pong/data/fastify
VOLUME_WEBSITE_FILES	= $(shell cd srcs/services/fastify && find src)
VOLUME_WEBSITE_FILES	:= $(VOLUME_WEBSITE_FILES)
VOLUME_DATABASE	= /home/ggiboury/goinfre/pong/data/sqlite

SECRETS	= ./srcs/secrets

SSL_CERTIFICATE	= ${SECRETS}/ssl.crt $(SECRETS)/ssl.key



test:
	@echo $(VOLUME_WEBSITE_FILES)

# Rules
#

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

$(VOLUME):
	mkdir -p $(VOLUME)

$(VOLUME_WEBSITE): | $(VOLUME)
	mkdir -p $(VOLUME_WEBSITE)

$(VOLUME_WEBSITE_FILES): | $(VOLUME_WEBSITE)
	@if [ ! ( -e $@ ) ] ; then \
		echo "Importing $@"; \
		cp @./ \
	fi

$(VOLUME_DATABASE): | $(VOLUME)
	mkdir -p $(VOLUME_DATABASE)
	

re : down $(NAME)

clean : down
	docker container prune -f

# docker image prune -af

# fclean : clean
# 	rm -rf data
# #	docker volume rm `(docker volume ls -q | grep srcs)`

down :
	docker compose -f $(COMPOSE_FILE) down -v

logs:
	docker compose -f $(COMPOSE_FILE) logs

status :
	docker container ls -a
	docker image ls -a

info : logs status

infow : status
	docker compose -f $(COMPOSE_FILE) logs website

.PHONY: re clean fclean down logs status info

