FROM lambci/lambda:build-nodejs6.10

ENV CODE_HOME /var/task
WORKDIR $CODE_HOME

RUN curl --silent --location https://dl.yarnpkg.com/rpm/yarn.repo | tee /etc/yum.repos.d/yarn.repo
RUN yum clean all && \
   yum -y install yarn

RUN npm install -g node-inspector

COPY package.json $CODE_HOME/
COPY yarn.lock $CODE_HOME/
RUN yarn --ignore-engines

COPY . $CODE_HOME/
CMD ["bash"]
