# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: ggiboury <ggiboury@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2025/04/22 15:00:40 by ggiboury          #+#    #+#              #
#    Updated: 2025/04/25 16:59:37 by ggiboury         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #


# Transcendence, a 42 project, done by dgoubin, romartin, ktaplin, ggiboury

# Variables
#
NAME	= pong

REQ	= $(VOLUME_DATABASE) $(VOLUME_WEBSITE) $(SSL_CERTIFICATE)

COMPOSE_FILE	= ./srcs/docker-compose.yml

VOLUME	= /home/ggiboury/goinfre/pong/data
VOLUME_WEBSITE	= /home/ggiboury/goinfre/pong/data/website
VOLUME_DATABASE	= /home/ggiboury/goinfre/pong/data/db_transcendence

SECRETS	= ./srcs/secrets

SSL_CERTIFICATE	= ${SECRETS}ssl.crt $(SECRETS)ssl.key


# Rules
#

$(NAME): $(REQ)
	docker compose -f $(COMPOSE_FILE) up -d

dev:
	cp ./srcs/services/sqlite/transcendence.db ${VOLUME_DATABASE}/
# cp ./srcs/services/transcendence.db ${VOLUME_DATABASE}/

all: $(NAME)


$(SECRETS):
	mkdir -p $(SECRETS)

$(SSL_CERTIFICATE): $(SECRETS)
	openssl req -x509 -newkey rsa:4096 -keyout ssl.key -out ssl.crt -sha256 -days 30 -nodes -subj "/C=FR/ST=France/L=Mulhouse/O=pong/CN=none"
	mv ssl.crt ssl.key ./srcs/secrets/

$(VOLUME):
	mkdir -p /home/ggiboury/goinfre/pong/data

$(VOLUME_WEBSITE): $(VOLUME)
	mkdir -p /home/ggiboury/goinfre/pong/data/website

$(VOLUME_DATABASE): $(VOLUME)
	mkdir -p /home/ggiboury/goinfre/pong/data/db_transcendence

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

# .PHONY: re clean fclean down logs status info

