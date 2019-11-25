# api-docs-product deployment instructions

**Prerequisites**

* Configure an ubuntu pod
* Install python
	* Install the virtualenv python library by executing the following command: pip install virtualenv
* Install node.js
	*  Execute the following command in the PoT-CodeGen folder (where this is the folder where the code from Git is cloned): npm install
* Execute 'chmod +x index.js' in the same PoT-CodeGen folder

**Configure codegen.service in order to keep the node.js server for this app online**

* Edit the codegen.service file (located in the Git repo under the folder service):
	* Replace the "path-to-node" placeholder with the path to node.js (in order to retrieve this, execute tge command 'which node' in a terminal - on our machine this returned "usr/bin/node")
	* Replace the "path-to-code" placeholder with the path to the above PoT-CodeGen folder
* Save codegen.service at path /etc/systemd/system/codegen.service
* Enable the service with the following command: 'sudo systemctl enable codegen.service'
* Start the service with the following command: 'sudo systemctl start codegen.service'

**Configure a DNS entry in order to point an of-trust.net subdomain to the IP address of the above pod**