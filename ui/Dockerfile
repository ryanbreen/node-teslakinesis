FROM ruby:2.2.0

RUN apt-get update -qq && apt-get install -y build-essential

# for nokogiri
RUN apt-get install -y libxml2-dev libxslt1-dev

# for capybara-webkit
RUN apt-get install -y libqt4-webkit libqt4-dev xvfb

# for a JS runtime
RUN apt-get install -y nodejs

ENV APP_HOME /tesla
RUN mkdir $APP_HOME
WORKDIR $APP_HOME

EXPOSE 3000

ADD Gemfile* $APP_HOME/
RUN bundle install

ADD . $APP_HOME