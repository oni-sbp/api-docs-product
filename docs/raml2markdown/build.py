#!/usr/bin/env python3
import os
import re
import json
import shutil
import sys
from pathlib import Path
import argparse
import platform


def api_swagger_to_slate(apiname, api_path, request_path):
    apiname = apiname.lower()
    swagger_file = Path(api_path)
    slate_path = request_path + "slate/" + apiname + ".md"
    slate_file = Path(slate_path)

    print("\nConverting "+apiname+" to Slate")

    # Convert from OpenAPISpec to Slate md
    local_swagger_to_slate = "./node_modules/.bin/swagger-to-slate"
    if platform.system() == "Windows":
        local_swagger_to_slate = ".\\node_modules\\.bin\\swagger-to-slate"

    swagger_to_slate = local_swagger_to_slate if os.path.exists(
        local_swagger_to_slate) else "swagger-to-slate"
    slatecmd = swagger_to_slate + " -i " + api_path + " -o " + slate_path

    failure = os.system(slatecmd)

    if failure:
        print("Swagger -> Slate formatted md file creation failed.")


def api_raml_to_slate(apiname, raml_file, request_path):
    apiname = apiname.lower()
    swagger_path = request_path + "OAS/" + apiname + ".json"
    swagger_file = Path(swagger_path)
    slate_path = request_path + "slate/" + apiname + ".md"
    slate_file = Path(slate_path)

    print("\nConverting "+apiname+" to Slate")
    # Generate API docs. First convert RAML -> OpenAPISpec file
    jsoncmd = "node ./oas-raml-converter/lib/bin/converter.js --from RAML --to OAS20 " + \
        raml_file + " > " + swagger_path
    failure = os.system(jsoncmd)

    if failure:
        print("RAML -> OpenAPISpec failed. Trying next in array.")
    else:
        # Convert from OpenAPISpec to Slate md
        local_swagger_to_slate = "./node_modules/.bin/swagger-to-slate"
        if platform.system() == "Windows":
            local_swagger_to_slate = ".\\node_modules\\.bin\\swagger-to-slate"

        swagger_to_slate = local_swagger_to_slate if os.path.exists(
            local_swagger_to_slate) else "swagger-to-slate"
        slatecmd = swagger_to_slate + " -i " + swagger_path + " -o " + slate_path
        failure = os.system(slatecmd)

        if failure:
            print("RAML -> Slate formatted md file creation failed.")


# ----------------------------
# MAIN - lets build it
parser = argparse.ArgumentParser(description='Options')
parser.add_argument("--type")
parser.add_argument("--path")
parser.add_argument("--apiname")
parser.add_argument("--requestfolder")
parser.add_argument("--examples")

args = parser.parse_args()

apiname = args.apiname.replace(' ', '-')
request_path = args.requestfolder

if args.type == "raml":
    api_raml_to_slate(apiname, args.path, request_path)
elif args.type == "swagger":
    api_swagger_to_slate(apiname, args.path, request_path)

try:
    with open(str(Path(request_path) / 'docs.json')) as file:
        data = json.load(file)
        data['APIs'].append(apiname)
        data['examples_paths'].append(args.examples)
except:
    data = {'APIs': [apiname], 'examples_paths': [args.examples]}

with open(str(Path(request_path) / 'docs.json'), 'w') as outfile:
    json.dump(data, outfile)
