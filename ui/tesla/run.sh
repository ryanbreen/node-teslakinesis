#!/bin/sh
. ./creds/creds.sh

RAILS_ENV=test DATABASE_URL=$DATABASE_URL ./bin/rails s