---
title: "Обзор Dokploy: удобная платформа для деплоя Docker-контейнеров и GitHub-проектов"
description: В этой статье мы разберём Dokploy — open-source платформу для деплоя приложений. Узнаем, какие задачи она решает, какие функции предлагает и чем отличается от популярного конкурента Coolify. В конце вы поймёте, подходит ли Dokploy для ваших проектов.
type: docs
author: veilosophy
date: 2025-01-13
tags: dokploy, docker, деплой, devops, self-hosted, coolify, traefik, ci/cd
keywords: dokploy, docker деплой, self-hosted платформа, альтернатива heroku, coolify vs dokploy, автоматический деплой, traefik, docker swarm
bannercolor: #f59b42
bannertext: dokploy
canonical: null
robots: index, follow
lang: ru
---

В этой статье мы разберём Dokploy — open-source платформу для деплоя приложений. Узнаем, какие задачи она решает, какие функции предлагает и чем отличается от популярного конкурента Coolify. В конце вы поймёте, подходит ли Dokploy для ваших проектов.

## 1 Часть. Установка

**Для установки понадобится ОС Linux**

We have tested on the following Linux Distros:
- Ubuntu 24.04 LTS
- Ubuntu 23.10
- Ubuntu 22.04 LTS
- Ubuntu 20.04 LTS
- Ubuntu 18.04 LTS
- Debian 12
- Debian 11
- Debian 10
- Fedora 40
- Centos 9
- Centos 8

Источник: https://docs.dokploy.com/docs/core/installation

**Требования**

Для корректной работы Dokploy на вашем сервере должно быть минимум 2 ГБ оперативной памяти и 30 ГБ дискового пространства. Эти характеристики необходимы для обработки ресурсов, потребляемых Docker во время сборки, и предотвращения зависания системы.

**Требования к портам:**
Перед установкой Dokploy убедитесь, что на вашем сервере доступны следующие порты:

Порт 80: HTTP-трафик (используется Traefik)
Порт 443: HTTPS-трафик (используется Traefik)
Порт 3000: Веб-интерфейс Dokploy

Важно: Установка завершится ошибкой, если какой-либо из этих портов уже занят. Убедитесь, что остановили все сервисы, использующие эти порты, перед запуском установочного скрипта.

Существует 2 официальных варианта установок платформы. Первый это с помощью скрипта и второй вариант "вручную". **2 вариант установки можете посмотреть в официальной документации dokploy ( https://docs.dokploy.com/docs/core/manual-installation )**

1 вариант: ``curl -sSL https://dokploy.com/install.sh | sh``

[dokploy1.png]
*Частая ошибка со скриптом.*

[dokploy2.png]
*Правильная установка если вы обычный пользователь вы сначала должны перейти в режим root, к примеру с помощью команды: ``sudo -i``*

**Внутри скрипта**

```
# Detct version from environment variable or default to latest
# Usage with curl (export first): export DOKPLOY_VERSION=canary && curl -sSL https://dokploy.com/install.sh | sh
# Usage with curl (export first): export DOKPLOY_VERSION=feature && curl -sSL https://dokploy.com/install.sh | sh
# Usage with curl (bash -s): DOKPLOY_VERSION=canary bash -s < <(curl -sSL https://dokploy.com/install.sh)
# Usage with curl (default): curl -sSL https://dokploy.com/install.sh | sh (defaults to latest)
# Usage with bash: DOKPLOY_VERSION=canary bash install.sh
# Usage with bash: DOKPLOY_VERSION=feature bash install.sh
# Usage with bash: bash install.sh (defaults to latest)
detect_version() {
    local version="${DOKPLOY_VERSION:-latest}"
    echo "$version"
}

# Function to detect if running in Proxmox LXC container
is_proxmox_lxc() {
    # Check for LXC in environment
    if [ -n "$container" ] && [ "$container" = "lxc" ]; then
        return 0  # LXC container
    fi
    
    # Check for LXC in /proc/1/environ
    if grep -q "container=lxc" /proc/1/environ 2>/dev/null; then
        return 0  # LXC container
    fi
    
    return 1  # Not LXC
}

install_dokploy() {
    # Detect version tag
    VERSION_TAG=$(detect_version)
    DOCKER_IMAGE="dokploy/dokploy:${VERSION_TAG}"
    
    echo "Installing Dokploy version: ${VERSION_TAG}"
    if [ "$(id -u)" != "0" ]; then
        echo "This script must be run as root" >&2
        exit 1
    fi

    # check if is Mac OS
    if [ "$(uname)" = "Darwin" ]; then
        echo "This script must be run on Linux" >&2
        exit 1
    fi

    # check if is running inside a container
    if [ -f /.dockerenv ]; then
        echo "This script must be run on Linux" >&2
        exit 1
    fi

    # check if something is running on port 80
    if ss -tulnp | grep ':80 ' >/dev/null; then
        echo "Error: something is already running on port 80" >&2
        exit 1
    fi

    # check if something is running on port 443
    if ss -tulnp | grep ':443 ' >/dev/null; then
        echo "Error: something is already running on port 443" >&2
        exit 1
    fi

    # check if something is running on port 3000
    if ss -tulnp | grep ':3000 ' >/dev/null; then
        echo "Error: something is already running on port 3000" >&2
        echo "Dokploy requires port 3000 to be available. Please stop any service using this port." >&2
        exit 1
    fi

    command_exists() {
      command -v "$@" > /dev/null 2>&1
    }

    if command_exists docker; then
      echo "Docker already installed"
    else
      curl -sSL https://get.docker.com | sh -s -- --version 28.5.0
    fi

    # Check if running in Proxmox LXC container and set endpoint mode
    endpoint_mode=""
    if is_proxmox_lxc; then
        echo "⚠️ WARNING: Detected Proxmox LXC container environment!"
        echo "Adding --endpoint-mode dnsrr to Docker services for LXC compatibility."
        echo "This may affect service discovery but is required for LXC containers."
        echo ""
        endpoint_mode="--endpoint-mode dnsrr"
        echo "Waiting for 5 seconds before continuing..."
        sleep 5
    fi


    docker swarm leave --force 2>/dev/null

    get_ip() {
        local ip=""
        
        # Try IPv4 first
        # First attempt: ifconfig.io
        ip=$(curl -4s --connect-timeout 5 https://ifconfig.io 2>/dev/null)
        
        # Second attempt: icanhazip.com
        if [ -z "$ip" ]; then
            ip=$(curl -4s --connect-timeout 5 https://icanhazip.com 2>/dev/null)
        fi
        
        # Third attempt: ipecho.net
        if [ -z "$ip" ]; then
            ip=$(curl -4s --connect-timeout 5 https://ipecho.net/plain 2>/dev/null)
        fi

        # If no IPv4, try IPv6
        if [ -z "$ip" ]; then
            # Try IPv6 with ifconfig.io
            ip=$(curl -6s --connect-timeout 5 https://ifconfig.io 2>/dev/null)
            
            # Try IPv6 with icanhazip.com
            if [ -z "$ip" ]; then
                ip=$(curl -6s --connect-timeout 5 https://icanhazip.com 2>/dev/null)
            fi
            
            # Try IPv6 with ipecho.net
            if [ -z "$ip" ]; then
                ip=$(curl -6s --connect-timeout 5 https://ipecho.net/plain 2>/dev/null)
            fi
        fi

        if [ -z "$ip" ]; then
            echo "Error: Could not determine server IP address automatically (neither IPv4 nor IPv6)." >&2
            echo "Please set the ADVERTISE_ADDR environment variable manually." >&2
            echo "Example: export ADVERTISE_ADDR=<your-server-ip>" >&2
            exit 1
        fi

        echo "$ip"
    }

    get_private_ip() {
        ip addr show | grep -E "inet (192\.168\.|10\.|172\.1[6-9]\.|172\.2[0-9]\.|172\.3[0-1]\.)" | head -n1 | awk '{print $2}' | cut -d/ -f1
    }

    advertise_addr="${ADVERTISE_ADDR:-$(get_private_ip)}"

    if [ -z "$advertise_addr" ]; then
        echo "ERROR: We couldn't find a private IP address."
        echo "Please set the ADVERTISE_ADDR environment variable manually."
        echo "Example: export ADVERTISE_ADDR=192.168.1.100"
        exit 1
    fi
    echo "Using advertise address: $advertise_addr"

    # Allow custom Docker Swarm init arguments via DOCKER_SWARM_INIT_ARGS environment variable
    # Example: export DOCKER_SWARM_INIT_ARGS="--default-addr-pool 172.20.0.0/16 --default-addr-pool-mask-length 24"
    # This is useful to avoid CIDR overlapping with cloud provider VPCs (e.g., AWS)
    swarm_init_args="${DOCKER_SWARM_INIT_ARGS:-}"
    
    if [ -n "$swarm_init_args" ]; then
        echo "Using custom swarm init arguments: $swarm_init_args"
        docker swarm init --advertise-addr $advertise_addr $swarm_init_args
    else
        docker swarm init --advertise-addr $advertise_addr
    fi
    
     if [ $? -ne 0 ]; then
        echo "Error: Failed to initialize Docker Swarm" >&2
        exit 1
    fi

    echo "Swarm initialized"

    docker network rm -f dokploy-network 2>/dev/null
    docker network create --driver overlay --attachable dokploy-network

    echo "Network created"

    mkdir -p /etc/dokploy

    chmod 777 /etc/dokploy

    docker service create \
    --name dokploy-postgres \
    --constraint 'node.role==manager' \
    --network dokploy-network \
    --env POSTGRES_USER=dokploy \
    --env POSTGRES_DB=dokploy \
    --env POSTGRES_PASSWORD=amukds4wi9001583845717ad2 \
    --mount type=volume,source=dokploy-postgres,target=/var/lib/postgresql/data \
    $endpoint_mode \
    postgres:16

    docker service create \
    --name dokploy-redis \
    --constraint 'node.role==manager' \
    --network dokploy-network \
    --mount type=volume,source=dokploy-redis,target=/data \
    $endpoint_mode \
    redis:7

    # Installation
    # Set RELEASE_TAG environment variable for canary/feature versions
    release_tag_env=""
    if [ "$VERSION_TAG" != "latest" ]; then
        release_tag_env="-e RELEASE_TAG=$VERSION_TAG"
    fi
    
    docker service create \
      --name dokploy \
      --replicas 1 \
      --network dokploy-network \
      --mount type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock \
      --mount type=bind,source=/etc/dokploy,target=/etc/dokploy \
      --mount type=volume,source=dokploy,target=/root/.docker \
      --publish published=3000,target=3000,mode=host \
      --update-parallelism 1 \
      --update-order stop-first \
      --constraint 'node.role == manager' \
      $endpoint_mode \
      $release_tag_env \
      -e ADVERTISE_ADDR=$advertise_addr \
      $DOCKER_IMAGE

    sleep 4

    docker run -d \
        --name dokploy-traefik \
        --restart always \
        -v /etc/dokploy/traefik/traefik.yml:/etc/traefik/traefik.yml \
        -v /etc/dokploy/traefik/dynamic:/etc/dokploy/traefik/dynamic \
        -v /var/run/docker.sock:/var/run/docker.sock:ro \
        -p 80:80/tcp \
        -p 443:443/tcp \
        -p 443:443/udp \
        traefik:v3.6.1
    
    docker network connect dokploy-network dokploy-traefik


    # Optional: Use docker service create instead of docker run
    #   docker service create \
    #     --name dokploy-traefik \
    #     --constraint 'node.role==manager' \
    #     --network dokploy-network \
    #     --mount type=bind,source=/etc/dokploy/traefik/traefik.yml,target=/etc/traefik/traefik.yml \
    #     --mount type=bind,source=/etc/dokploy/traefik/dynamic,target=/etc/dokploy/traefik/dynamic \
    #     --mount type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock \
    #     --publish mode=host,published=443,target=443 \
    #     --publish mode=host,published=80,target=80 \
    #     --publish mode=host,published=443,target=443,protocol=udp \
    #     traefik:v3.6.1

    GREEN="\033[0;32m"
    YELLOW="\033[1;33m"
    BLUE="\033[0;34m"
    NC="\033[0m" # No Color

    format_ip_for_url() {
        local ip="$1"
        if echo "$ip" | grep -q ':'; then
            # IPv6
            echo "[${ip}]"
        else
            # IPv4
            echo "${ip}"
        fi
    }

    public_ip="${ADVERTISE_ADDR:-$(get_ip)}"
    formatted_addr=$(format_ip_for_url "$public_ip")
    echo ""
    printf "${GREEN}Congratulations, Dokploy is installed!${NC}\n"
    printf "${BLUE}Wait 15 seconds for the server to start${NC}\n"
    printf "${YELLOW}Please go to http://${formatted\\_addr}:3000${NC}\n\n"
}

update_dokploy() {
    # Detect version tag
    VERSION_TAG=$(detect_version)
    DOCKER_IMAGE="dokploy/dokploy:${VERSION_TAG}"
    
    echo "Updating Dokploy to version: ${VERSION_TAG}"
    
    # Pull the image
    docker pull $DOCKER_IMAGE

    # Update the service
    docker service update --image $DOCKER_IMAGE dokploy

    echo "Dokploy has been updated to version: ${VERSION_TAG}"
}

# Main script execution
if [ "$1" = "update" ]; then
    update_dokploy
else
    install_dokploy
fi
```

**Что делает данный скрипт**

- Определение версии для установки

Проверяет переменную окружения DOKPLOY_VERSION
Если не указана — использует latest
Поддерживает версии: latest, canary, feature

- Проверка среды выполнения

Определяет, запущен ли скрипт в Proxmox LXC-контейнере
 Проверяет, запущен ли от root (если нет — выход с ошибкой)
 Проверяет, что это Linux (не macOS)
 Проверяет, что скрипт не запущен внутри Docker-контейнера

- Проверка занятости портов

Порт 80 — должен быть свободен
Порт 443 — должен быть свободен
Порт 3000 — должен быть свободен (для веб-интерфейса Dokploy)

Если хоть один порт занят — установка прерывается

- Установка Docker

Проверяет, установлен ли Docker
Если нет — устанавливает Docker версии 28.5.0 через официальный скрипт

- Инициализация Docker Swarm

Принудительно выходит из существующего Swarm (если был)
Определяет IP-адрес сервера (приватный или публичный)
Инициализирует новый Docker Swarm кластер
Для LXC добавляет флаг --endpoint-mode dnsrr (для совместимости)

- Создание сети

Удаляет старую сеть dokploy-network (если была)
Создаёт новую overlay-сеть dokploy-network для связи контейнеров

- Создание директории конфигурации

Создаёт /etc/dokploy
Устанавливает права 777 (полный доступ)

- Запуск PostgreSQL

Создаёт Docker-сервис dokploy-postgres
База данных: dokploy
Пользователь: dokploy
Пароль: amukds4wi9001583845717ad2 (захардкожен)
Данные хранятся в volume dokploy-postgres

- Запуск Redis

Создаёт Docker-сервис dokploy-redis
Используется для кеширования и очередей
Данные хранятся в volume dokploy-redis

- Запуск основного сервиса Dokploy

Монтирует Docker socket (для управления контейнерами)
Монтирует /etc/dokploy для конфигурации
Публикует порт 3000 для веб-интерфейса
Использует образ согласно выбранной версии

- Запуск Traefik (reverse proxy)

Запускает Traefik версии 3.6.1
Обрабатывает HTTP (порт 80) и HTTPS (порт 443)
Автоматически управляет маршрутизацией и SSL-сертификатами
Подключается к сети dokploy-network

- Завершение установки

Определяет публичный IP-адрес сервера (IPv4 или IPv6)
Выводит сообщение об успешной установке
Показывает URL для доступа: http://[IP]:3000
Предупреждает подождать 15 секунд до запуска

Возможные ошибки при установке

bash: Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running? Error: Failed to initialize Docker Swarm

Решается перезапуском Docker или перезагрузкой системы:

``systemctl status docker`` проверка статуса

``systemctl start docker`` запуск / перезапуск docker
[dokploy3.png]
*как мы видим проблема исправилась.*

теперь можем запустить снова скрипт и посмотреть docker ps чтобы посмотреть какие контейнеры работают, какие работают на 0.0.0.0 (мб многие пользователи не хотят чтобы они были на 0.0.0.0, через скрипт будет по стандарту работать на 0.0.0.0 dokploy и traefik)

[dokploy4.png]

## 2 Часть. Обзор интерфейса и основных возможностей

> Сразу скажу что в статье рассмотрим только основные функции которые в большинстве случаев используется.

[dokploy5.png]
*Впервые при заходе в Dokploy вы устанавливаете вход: Setup the server*

[dokploy6.png]

*После setup'а вы попадаете в сам уже dokploy*

### Кастомизация
[dokploy7.png]

- смена темы

- язык dokploy GUI (Не все будут нормально сделаны. т.е тот же Русский вариант частично есть, где-то английский в основном где-то на Русском.)

[dokploy8.png]

Можно изменить фавикон, имя организации и добавить новую организацию / сервер.

[dokploy9.png]
*Web Server*

### Раздел Web Server в Dokploy

На странице **Web Server** в настройках Dokploy можно управлять основными параметрами сервера и системой. Рассмотрим доступные функции:

# 1. Домен сервера

Здесь настраивается домен для панели управления Dokploy:

- **Домен** — указываете доменное имя (например, `dokploy.com`)
- **Email для Let's Encrypt** — email для автоматического получения SSL-сертификатов
- **HTTPS** — переключатель для автоматической выдачи SSL-сертификата через Let's Encrypt

После настройки нажмите **"Сохранить"**, и панель будет доступна по вашему домену с HTTPS.

# 2. Веб-сервер (Server)

В этом блоке показана информация о сервере и доступны действия по управлению:

# Информация о сервере:
- **Server IP** — IP-адрес вашего сервера
- **Version** — текущая версия Dokploy (например, v0.26.3)
- **Daily Docker Cleanup** — автоматическая ежедневная очистка неиспользуемых Docker-ресурсов

# Действия с сервером:

**Меню "Сервер":**
- **Перезагрузить** — перезапуск сервера Dokploy
- **Открыть терминал** — доступ к консоли сервера прямо из веб-интерфейса
- **Просмотр логов** — просмотр логов работы Dokploy
- **GPU Setup** — настройка GPU (если используете машинное обучение или рендеринг)
- **Изменить IP адрес** — смена IP-адреса сервера
- **Clean Redis** — очистка кеша Redis
- **Reload Redis** — перезагрузка Redis

# Дисковое пространство:

**Действия:**
- **Очистить неиспользуемые образы** — удаление Docker-образов, которые больше не используются
- **Очистить неиспользуемые тома** — удаление Docker volumes без привязки к контейнерам
- **Очистить остановленные контейнеры** — удаление всех остановленных контейнеров
- **Очистить Docker Builder и систему** — глубокая очистка системы сборки Docker
- **Очистить мониторинг** — удаление данных мониторинга
- **Очистить всё** — полная очистка всех неиспользуемых ресурсов

## 3. Traefik (Reverse Proxy)

Traefik — это reverse proxy, который автоматически управляет маршрутизацией трафика к вашим приложениям.

# Действия:
- **Перезагрузить** — перезапуск Traefik
- **Просмотр логов** — логи работы Traefik (полезно для диагностики проблем с доменами)
- **Изменить переменные окружения** — настройка дополнительных параметров Traefik
- **Enable Dashboard** — включение веб-панели Traefik для мониторинга маршрутов
- **Назначение портов** — управление портами для HTTP/HTTPS

# Кнопка "Check for updates":
Проверка доступных обновлений для Traefik.

# 4. Backups

Блок для настройки резервного копирования базы данных Dokploy на внешние хранилища (S3, Google Cloud, и т.д.).

[dokploy10.png]
*Profile*

### Раздел Profile в Dokploy

На странице **Profile** настраивается профиль пользователя и управление API-ключами для доступа к Dokploy через API/CLI.

# 1. Аккаунт

Здесь можно изменить данные профиля администратора:

# Поля для заполнения:
- **First Name** — Имя пользователя
- **Last Name** — Фамилия пользователя
- **Email** — Email-адрес аккаунта
- **Current Password** — Текущий пароль (для подтверждения изменений)
- **Пароль** — Новый пароль (если хотите изменить)

# Аватар:
- Можно выбрать аватар из предустановленных изображений
- Кнопка **"+"** позволяет загрузить собственное изображение
- Первая иконка с буквами (TT) — это аватар по умолчанию с инициалами

# Двухфакторная аутентификация:
- Кнопка **"Enable 2FA"** — включение двухфакторной аутентификации для дополнительной защиты аккаунта

После внесения изменений нажмите **"Сохранить"**.

# 2. API/CLI Keys

Этот раздел позволяет создавать и управлять API-ключами для доступа к Dokploy через API или командную строку (CLI).

# Что это даёт?
API-ключи используются для:
- Автоматизации деплоя через CI/CD (GitHub Actions, GitLab CI и т.д.)
- Управления проектами через терминал
- Интеграции Dokploy с другими сервисами

# Интерфейс:
- **Swagger API: View** — ссылка на документацию API (Swagger UI), где можно посмотреть все доступные эндпоинты и протестировать запросы
- **No API keys found** — пока API-ключей нет
- **Generate New Key** — кнопка для создания нового API-ключа

# Как использовать:
1. Нажмите **"Generate New Key"**
2. Скопируйте созданный ключ (он будет показан только один раз!)
3. Используйте ключ в запросах к API или в настройках CLI
   
[dokploy11.png]

### Раздел Git в Dokploy

На странице **Git** настраивается интеграция с Git-провайдерами для автоматического деплоя приложений из репозиториев.

# Git Providers

**Описание:** "Connect your Git provider for authentication" — подключите ваш Git-провайдер для аутентификации и автоматического деплоя проектов.

# Поддерживаемые Git-провайдеры:

Dokploy поддерживает интеграцию с четырьмя основными платформами:

1. **GitHub** (чёрная кнопка)
   - Самый популярный Git-хостинг
   - Позволяет деплоить проекты прямо из GitHub-репозиториев
   
2. **GitLab** (фиолетовая кнопка)
   - Альтернатива GitHub с встроенным CI/CD
   - Поддержка как публичных, так и self-hosted инстансов

3. **Bitbucket** (синяя кнопка)
   - Git-платформа от Atlassian
   - Популярна в корпоративной среде

4. **Gitea** (зелёная кнопка)
   - Легковесный self-hosted Git-сервис
   - Идеален для приватных серверов

# Как это работает?

После подключения Git-провайдера:

1. **Автоматическая авторизация** — Dokploy получает доступ к вашим репозиториям
2. **Выбор репозитория** — при создании проекта вы сможете выбрать репозиторий из списка
3. **Автодеплой** — при каждом push в выбранную ветку Dokploy автоматически пересобирает и деплоит приложение
4. **Webhook-интеграция** — Dokploy создаёт webhook для отслеживания изменений в репозитории

# Зачем это нужно?

Интеграция с Git-провайдерами позволяет:
- Деплоить приложения одним кликом из интерфейса
- Настроить CI/CD без дополнительных инструментов
- Автоматически обновлять приложение при изменениях в коде
- Управлять версиями через Git-теги и ветки
- Откатываться на предыдущие версии через интерфейс

# Как подключить?

1. Нажмите на кнопку нужного провайдера (например, **GitHub**)
2. Авторизуйтесь через OAuth (вас перенаправит на страницу авторизации)
3. Разрешите Dokploy доступ к репозиториям
4. После подключения провайдер появится в списке на этой странице

**И МНОГО ЧЕГО ПОЛЕЗНОГО!**

[dokploy12.png]
*Мониторинг (Redis)*

Дальше рекомендую изучить остальные функции самостоятельно а мы переходим к самому необходимому - **к деплою.**

[dokploy13.png]

## 3 Часть. Деплой приложений. Какие можно?

в основном в работе я использовал его как деплой docker контейнеров, но по вашему усмотрению вы можете задеплоить и github проекты( к примеру какой нибудь сайт ваш). 

чтобы что то создать: Для этого вы нажимаете Create Project в секции Projects
[dokploy14.png]


[dokploy15.png]
*пишите имя и описание(необязательно) и нажимаете Create*

[dokploy16.png]
*результат*

Далее в зависимости от необходимости вы можете настроить **Environments**

**Рассмотрим создание сервиса.** 
[dokploy17.png]

Application - ваши приложения ( к примеру из гитхаб сайт ) 

[dokploy18.png]
*Application - обзор функций и варианты сборок видны на скриншоте*

Templates - готовые конфиги докер для быстрого развертывания сервисов.

[dokploy19.png]
*выбор шаблонов докер*

> ВНИМАНИЕ: Не так давно шаблоны перестали работать по неизвестной причине(возможная причина это блокировки тк с впн у меня все ок работает.) Решение: https://templates.dokploy.com/ - это теже шаблоны просто в онлайн версии.

[dokploy20.png]
*ошибка с загрузкой шаблонов*

Database - создаются БД под ваши настройки.
[dokploy21.png]

### Эксперимент - пробуем поставить n8n.

n8n (произносится «нэйтн») — это платформа с открытым исходным кодом для автоматизации рабочих процессов и интеграции разных приложений и сервисов без необходимости писать код (low-code/no-code). Она работает как визуальный конструктор, где вы соединяете блоки (узлы) для создания цепочек действий: когда что-то происходит в одном сервисе, n8n автоматически выполняет заданные задачи в других. Инструмент используется для автоматизации рутинных операций, создания сложных интеграций между CRM, мессенджерами, базами данных и другими системами, а также для внедрения ИИ-функций. 

Выбираем Compose 
[dokploy22.png]

создаем композ
[dokploy23.png]

После создания, заходим в созданный раздел и выбираем raw.
[dokploy24.png]

Переходим на сайт (либо в шаблоны быстрое разворачиваем) и выбираем нужный стек с n8n, мне он нужен без БД поэтому я выбираю первый.
[dokploy25.png]

копируем конфиг и вставляем его в raw и нажимаем на save
[dokploy26.png]

Переходим в Environment Settings и добавляем 

N8N_HOST=your-domain.com  *или просто IP, если нет домена:*
N8N_PORT=5678
GENERIC_TIMEZONE=Europe/Moscow

[dokploy27.png]
*возвращаемся в General и нажимаем Deploy*


[dokploy28.png]
*логи n8n установки*

вас потом перекинет возможно в логи - там вы смотрите успешно ли все запустилось или нет.

После успешной установки можем проверить и зайти что n8n работает: 

> я менял немного под себя композ тк хотел поставить локально, если кому надо вот:

```
services:
  n8n:
    image: docker.n8n.io/n8nio/n8n:1.104.0
    restart: always
    ports:
      - "${N8N_PORT}:5678"
    environment:
      - N8N_HOST=${N8N_HOST}
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - NODE_ENV=production
      - WEBHOOK_URL=http://${N8N_HOST}:${N8N_PORT}/
      - GENERIC_TIMEZONE=${GENERIC_TIMEZONE}
      - N8N_SECURE_COOKIE=false
    volumes:
      - n8n_data:/home/node/.n8n

volumes:
  n8n_data:
```

```
N8N_HOST=localhost
N8N_PORT=5678
GENERIC_TIMEZONE=Europe/Moscow
```

## 4 Часть. Мнение и плюсы и минусы проекта.

Сравнение с Coolify

По функциям Dokploy и Coolify практически не отличаются, разве что Dokploy больше ориентирован на команды, поэтому некоторые функции могут показаться избыточными для соло-энтузиастов. Ниже — официальное сравнение от Dokploy docs:

[dokploy29.png]

## Плюсы и минусы Dokploy

Я пользовался платформой полгода-год, и вот что могу сказать:

**✅ Плюсы**

**Оптимизация ресурсов — главное преимущество**
Несмотря на мелкие недочёты (например, неполные переводы на некоторые языки), по сравнению с Coolify и другими аналогами Dokploy потребляет гораздо меньше ресурсов. Нет аномальных нагрузок, когда процессор нагружается на 100% в простое — такие моменты встречались у пользователей Coolify.

**Современный интерфейс**
 Это субъективно, но проект использует shadcn/ui компоненты. Тем, кто не знаком, рекомендую посмотреть мою прошлую статью: "Вайбкодерам и веб-разработчикам на заметку! Список сайтов с готовыми React UI-компонентами". (плюс ставится за выбор хорошей легкой библиотеки)

**Покрывает все потребности**
 Я в основном работаю с Docker-контейнерами, сайтами и GitHub-проектами. Когда понадобилось быстро развернуть сайт локально, а затем выкатить в интернет — Dokploy справился на ура.

**❌ Минусы**

**"Специфические" интеграции**
 Не рекомендую использовать Dokploy, если у вас другой reverse proxy (не Traefik). Часть функций просто не будет работать, и придётся писать собственные скрипты или compose-файлы под ваш прокси.

У меня был случай, когда понадобился модифицированный Nginx Proxy Manager, и после его установки пришлось делать много ручной работы.

**Что хотелось бы улучшить:**
 Идеально было бы добавить в Dokploy возможность переключать reverse proxy по кнопке (Traefik, Nginx, Caddy и т.д.). Тогда это была бы лучшая платформа для деплоя, которую я когда-либо видел.

**Проблемы с шаблонами?**
 Я бы не стал записывать это в минусы, так как это не проблема самого проекта.

Не особо критичные и мелкие ошибки по типу перевода платформы под свой язык.

**Итоговая оценка 8/10**

Проект очень классный и останется пока в моем топе-1 на данный момент как платформа для развертывания проектов.

**Рекомендация для читателей и тем кому нужно больше информации:**

https://github.com/Dokploy/dokploy

https://docs.dokploy.com/

https://templates.dokploy.com/

https://dokploy.com/
