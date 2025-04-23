# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: ggiboury <ggiboury@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2025/04/22 15:00:40 by ggiboury          #+#    #+#              #
#    Updated: 2025/04/23 16:15:57 by ggiboury         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #


# Transcendence, a 42 project, done by dgoubin, romartin, ktaplin, ggiboury

# Variables
#

COMPOSE_FILE	= ./srcs/docker-compose.yml

# VOLUME_WEBSITE	= /home/ggiboury/data/www
VOLUME_DATABASE	= /home/ggiboury/goinfre/db_transcendence

# SECRETS	= ./srcs/secrets/

# SSL_CERTIFICATE	= $(SECRETS)site.key ${SECRETS}site.crt

# REQ	= $(VOLUME_DATABASE) $(VOLUME_WEBSITE) $(SECRETS) $(SSL_CERTIFICATE)
REQ	= $(VOLUME_DATABASE)

NAME	= pong

# Rules
#

$(NAME): $(REQ)
	docker compose -f $(COMPOSE_FILE) up -d

dev:
	cp ./srcs/sqlite/transcendence.db ${VOLUME_DATABASE}/

all: $(NAME)


# $(SECRETS):
# 	mkdir -p $(SECRETS)

# $(VOLUME_WEBSITE):
# 	mkdir -p /home/ggiboury/data/www

$(VOLUME_DATABASE):
	mkdir -p /home/ggiboury/goinfre/db_transcendence

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

