#!/usr/bin/env python3
import os
import re
import shutil
import sys
from pathlib import Path
import argparse
import platform

APIs = []
examples_paths = []


def api_swagger_to_slate(apiname, api_path, request_path):
  apiname = apiname.lower()
  swagger_file = Path(api_path)
  slate_path = request_path + "slate/" + apiname + ".md"
  slate_path = request_path + "slate/" + apiname + ".md"
  slate_file = Path(slate_path)

  print("\nConverting "+apiname+" to Slate")

  # Convert from OpenAPISpec to Slate md
  local_swagger_to_slate = "./node_modules/.bin/swagger-to-slate"
  if platform.system() == "Windows":
    local_swagger_to_slate = ".\\node_modules\\.bin\\swagger-to-slate"
  
  swagger_to_slate = local_swagger_to_slate if os.path.exists(local_swagger_to_slate) else "swagger-to-slate"
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
  jsoncmd = "node ./oas-raml-converter/lib/bin/converter.js --from RAML --to OAS20 " + raml_file + " > " + swagger_path
  failure = os.system(jsoncmd)

  if failure:
    print("RAML -> OpenAPISpec failed. Trying next in array.")
  else:
    # Convert from OpenAPISpec to Slate md
    local_swagger_to_slate = "./node_modules/.bin/swagger-to-slate"
    if platform.system() == "Windows":
      local_swagger_to_slate = ".\\node_modules\\.bin\\swagger-to-slate"

    swagger_to_slate = local_swagger_to_slate if os.path.exists(local_swagger_to_slate) else "swagger-to-slate"
    slatecmd = swagger_to_slate + " -i " + swagger_path + " -o " + slate_path
    failure = os.system(slatecmd)

    if failure:
      print("RAML -> Slate formatted md file creation failed.")


# Generate path according to code examples location pattern:
# https://github.com/PlatformOfTrust/code-examples-generator/tree/master/doc#4-code-example-location
def get_generated_code_examples_path(root, line, api):
  line = line.rstrip(os.linesep)
  line = re.sub('[`*]', '', line)
  line_arr = line.split(' ')
  # parse HTTP method
  method = line_arr[0]
  # convert forward slashes to underscores to match code examples file path
  if len(line_arr) > 1 :
    filename = re.sub('[/]', '_', line_arr[1])
  else:
    filename = ''

  return Path('/'.join([root + filename, method, "slate.md"]))


def get_generated_code_examples_path_swagger(root, line, api):
  line = line.rstrip(os.linesep)
  line = re.sub('[`*]', '', line)
  line_arr = line.split(' ')
  # parse HTTP method
  method = line_arr[0]
  # convert forward slashes to underscores to match code examples file path
  if len(line_arr) > 1 :
    filename = re.sub('[/]', '_', line_arr[1])
  else:
    filename = ''

  return Path('/'.join([root + filename, method, "slate.md"]))

def concatenate_files(request_path):
  code_examples_path = request_path + '/Generated examples'
  outfile = Path(request_path + "/source/index.html.md")
  
  if outfile.exists():
    os.remove(outfile)
  else:
    print("File: index.html.md delete failed. File not found!")

  with open(outfile, 'w') as ofile:
    with open(Path("slate/index.md")) as infile:
      ofile.write(infile.read())

    for api_index, api  in enumerate(APIs):
      slatefile = Path(request_path + "slate/" + api.lower() + ".md")

      ofile.write("# " + api.replace("-", " ").replace("api", "") + "\n")
      pretty_api_name = api.replace("-", " ").replace("api", "API")

      ofile.write("\n> **Get "+pretty_api_name+ " related resources:**\n\n")
      ofile.write("> <div class='hexagon'><div class='hexagon-inside'><div class='hexagon-inside2'>")
      ofile.write("<a href='./specs/oas/"+ api.lower() + ".json' title='Get OpenAPI Specification Resources'>")
      ofile.write("<img src='images/oas.png' class='openApiSpec-lg'>")
      ofile.write("</a></div></div></div>")
      ofile.write("\n")
      ofile.write("> <div class='hexagon'><div class='hexagon-inside'><div class='hexagon-inside2'>")
      ofile.write("<a href='./specs/raml/"+ api.lower() + ".zip' title='Get RAML Specification Resources'>")
      ofile.write("<img src='images/raml.png' class='ramlSpec-lg'>")
      ofile.write("</a></div></div></div>")
      ofile.write("\n\n")

      infile = open(slatefile, 'r').readlines()
      for index, line in enumerate(infile):

        # Now match the lines after which the code examples are injected.
        # example of one line: `***PUT*** /products/{product_code}`
        # That should match product-api_PUT_product_code.curl in examples folder
        copyline = str(line)

        example_method = str(line)
        example_method = re.sub('[`#*]', '', example_method)

        if args.type == "raml":
          example_file_path = get_generated_code_examples_path(
            examples_paths[api_index],
            str(line),
            api.lower()
          )
        elif args.type == "swagger":
          example_file_path = get_generated_code_examples_path_swagger(
            examples_paths[api_index],
            str(line),
            api.lower()
          )

        example_desc = "\n\n > <b>Example for: "+example_method.replace("{version}","v1")+"</b>\n\n"
        if len(str(example_file_path)) < 300:
          try:
            if example_file_path.exists():
              with open(example_file_path) as sfile:
                print("Found example file: " + str(example_file_path) +" derived from line:" + copyline)
                ofile.write("> <div class='hexagon-so'><div class='hexagon-inside-so'><div class='hexagon-inside2-so'><p>Do you need help in using the "+example_method.replace("{version}","v1")+"? </p>")
                ofile.write("<li><a href='https://stackoverflow.com/questions/tagged/platform-of-trust' title='Check out Platform of Trust questions and answers in Stack Overflow' target='new'>Checkout existing questions & answers</a></li>")
                ofile.write("<li><a href='https://stackoverflow.com/questions/ask?guided=false&tags=platform-of-trust,"+api.lower()+"' title='Ask a question in Stack Overflow' target='new'>Ask a question in Stack Overflow</a></li>")
                ofile.write("</br>")
                ofile.write(
                  "<li><a href='https://github.com/PlatformOfTrust/docs/issues/new?assignees=&template=i-m-in-pain--here-s-the-symptoms.md&title=Customer+wish&labels="+ api.lower()+",Wish' title='Make a wish!' target='new'>Did we miss something? Make a wish!</a></li>")
                ofile.write("<div style='min-height:30px;'>&nbsp;</div>")
                ofile.write("</div></div></div>")
                ofile.write("\n\n")
                ofile.write(example_desc)
                ofile.write(sfile.read()+"\n\n")
          except:
            pass
        # Ugly way of getting rid of some markup in the beginning of each file. Get everything after line 18 and
        # save to final markdown file
        if index > 18:
          # Some markdown cleanup since the converters mess things up
          if line.startswith("#"):
            ofile.write("#"+line.lower().replace("***", "**").replace("{version}","v1"))
          elif line.startswith("`***"):
            ofile.write(line.replace("***", "**").replace("`", "").replace("{version}","v1"))
          else:
            ofile.write(line.replace("***", "**").replace("{version}","v1"))

  print("\n\nSlate file: "+str(outfile)+" created.")


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

APIs.append(apiname)
examples_paths.append(args.examples)

# Merge all together
concatenate_files(request_path)
