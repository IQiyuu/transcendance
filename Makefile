NAME    = trong
COMPOSE = docker compose -f ./srcs/docker-compose.yml

SECRETS = ./srcs/secrets
SSL_CRT = $(SECRETS)/ssl.crt
SSL_KEY = $(SECRETS)/ssl.key
JWT     = $(SECRETS)/JWT-secret

all: $(NAME)

$(NAME): $(SSL_CRT) $(SSL_KEY) $(JWT)
	$(COMPOSE) up -d --build

$(SECRETS):
	mkdir -p $@

$(SSL_CRT) $(SSL_KEY) &: | $(SECRETS)
	openssl req -x509 -newkey rsa:4096 -keyout $(SSL_KEY) -out $(SSL_CRT) \
		-sha256 -days 30 -nodes -subj "/C=FR/ST=France/L=Mulhouse/O=pong/CN=none"
	chmod 644 $(SSL_CRT) $(SSL_KEY)

$(JWT): | $(SECRETS)
	openssl rand -hex 32 > $@
	chmod 644 $@

tunnel:
	cloudflared tunnel --url https://localhost:3000 --no-tls-verify

down:
	$(COMPOSE) down

clean: down
	docker container prune -f

# efface aussi les volumes : la base de données est supprimée
fclean:
	$(COMPOSE) down -v --rmi local
	rm -rf $(SECRETS)

re: fclean all

logs:
	$(COMPOSE) logs

status:
	docker container ls -a
	docker image ls -a

.PHONY: all down clean fclean re logs status