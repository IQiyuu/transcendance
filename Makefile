
# Transcendence, a 42 project, done by 

# Variables
#

COMPOSE_FILE	= ./srcs/docker-compose.yml

# VOLUME_WEBSITE	= /home/ggiboury/data/www
# VOLUME_DATABASE	= /home/ggiboury/data/db

# SECRETS	= ./srcs/secrets/

# SSL_CERTIFICATE	= $(SECRETS)site.key ${SECRETS}site.crt

# REQ	= $(VOLUME_DATABASE) $(VOLUME_WEBSITE) $(SECRETS) $(SSL_CERTIFICATE)

NAME	= pong

# Rules
#


$(NAME): $(REQ)
	docker compose -f $(COMPOSE_FILE) up -d

all: $(NAME)


# $(SECRETS):
# 	mkdir -p $(SECRETS)

# $(VOLUME_WEBSITE):
# 	mkdir -p /home/ggiboury/data/www

# $(VOLUME_DATABASE):
# 	mkdir -p /home/ggiboury/data/db

re : down $(NAME)

clean : down
	docker container prune -f
# docker image prune -af

# fclean : clean
# 	rm -rf data
# #	docker volume rm `(docker volume ls -q | grep srcs)`

down :
	docker compose -f $(COMPOSE_FILE) down

logs:
	docker compose -f $(COMPOSE_FILE) logs

status :
	docker container ls -a
	docker image ls -a

info : logs status

# .PHONY: re clean fclean down logs status info

