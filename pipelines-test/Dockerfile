FROM ubuntu:18.04

ENV LC_ALL=C.UTF-8 \
    LANG=C.UTF-8 \
    WORKON_HOME="/.venv" \
    USER="api" \
    GROUP="api" \
    UID=1000 \
    GID=1000 \
    PYTHONUNBUFFERED=1 \
    POETRY_HOME="/usr/local/poetry" \
    POETRY_VERSION="0.12.17" \
    PATH="${PATH}:/.venv:/usr/local/poetry/bin"

# Install 
RUN apt-add-repository ppa:brightbox/ruby-ng
    add-apt-repository ppa:linuxuprising/java
    apt-get update && \
    apt-get install ruby2.4 ruby2.4-dev
    apt-get install oracle-java13-installer
    apt install python-pip
