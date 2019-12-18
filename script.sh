# Install MongoDB
# https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/
wget -qO - https://www.mongodb.org/static/pgp/server-4.2.asc | sudo apt-key add -
sudo apt-get install gnupg
wget -qO - https://www.mongodb.org/static/pgp/server-4.2.asc | sudo apt-key add -
echo "deb [ arch=amd64 ] https://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/4.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.2.list
sudo apt-get update
sudo apt-get install -y mongodb-org
echo "mongodb-org hold" | sudo dpkg --set-selections
echo "mongodb-org-server hold" | sudo dpkg --set-selections
echo "mongodb-org-shell hold" | sudo dpkg --set-selections
echo "mongodb-org-mongos hold" | sudo dpkg --set-selections
echo "mongodb-org-tools hold" | sudo dpkg --set-selections
sudo service mongod start
sudo service mongod status


# Install ruby
# https://stackoverflow.com/questions/47037665/whats-the-best-way-to-install-ruby-2-4-on-kubuntu-17-10/47046013#47046013

#sudo apt-add-repository ppa:brightbox/ruby-ng
#sudo apt-get update
#sudo apt-get install ruby2.4 ruby2.4-dev
#ruby2.4 -v

# Install pip
# apt install python-pip

cd api-docs-product
mkdir resources/Temp-Files

chmod +x index.js
npm install


# cd docs
# gem install bundle
# bundle install

# cd raml2markdown
# npm install
# npm install swagger-to-slate

# cd ..
# cd ..

cp service/codegen.service /etc/systemd/system/codegen.service


sudo systemctl enable codegen.service
systemctl start codegen.service