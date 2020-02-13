import argparse
import json
from pathlib import Path
import os
import re


APIs = []
examples_paths = []


# Generate path according to code examples location pattern:
# https://github.com/PlatformOfTrust/code-examples-generator/tree/master/doc#4-code-example-location
def get_generated_code_examples_path(root, line, api):
    line = line.rstrip(os.linesep)
    line = re.sub('[`*]', '', line)
    line_arr = line.split(' ')
    # parse HTTP method
    method = line_arr[0]
    # convert forward slashes to underscores to match code examples file path
    if len(line_arr) > 1:
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
        print(APIs)
        for api_index, api in enumerate(APIs):
            slatefile = Path(request_path + "slate/" + api.lower() + ".md")
            print(slatefile)
            ofile.write("# " + api.replace("-", " ").replace("api", "") + "\n")
            pretty_api_name = api.replace("-", " ").replace("api", "API")

            ofile.write("\n> **Get "+pretty_api_name +
                        " related resources:**\n\n")
            ofile.write(
                "> <div class='hexagon'><div class='hexagon-inside'><div class='hexagon-inside2'>")
            ofile.write("<a href='./specs/oas/" + api.lower() +
                        ".json' title='Get OpenAPI Specification Resources'>")
            ofile.write("<img src='images/oas.png' class='openApiSpec-lg'>")
            ofile.write("</a></div></div></div>")
            ofile.write("\n")
            ofile.write(
                "> <div class='hexagon'><div class='hexagon-inside'><div class='hexagon-inside2'>")
            ofile.write("<a href='./specs/raml/" + api.lower() +
                        ".zip' title='Get RAML Specification Resources'>")
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

                example_file_path = get_generated_code_examples_path(
                    examples_paths[api_index],
                    str(line),
                    api.lower()
                )

                example_desc = "\n\n > <b>Example for: " + \
                    example_method.replace("{version}", "v1")+"</b>\n\n"
                if len(str(example_file_path)) < 300:
                    try:
                        if example_file_path.exists():
                            with open(example_file_path) as sfile:
                                print(
                                    "Found example file: " + str(example_file_path) + " derived from line:" + copyline)
                                ofile.write("> <div class='hexagon-so'><div class='hexagon-inside-so'><div class='hexagon-inside2-so'><p>Do you need help in using the " +
                                            example_method.replace("{version}", "v1")+"? </p>")
                                ofile.write(
                                    "<li><a href='https://stackoverflow.com/questions/tagged/platform-of-trust' title='Check out Platform of Trust questions and answers in Stack Overflow' target='new'>Checkout existing questions & answers</a></li>")
                                ofile.write("<li><a href='https://stackoverflow.com/questions/ask?guided=false&tags=platform-of-trust,"+api.lower(
                                )+"' title='Ask a question in Stack Overflow' target='new'>Ask a question in Stack Overflow</a></li>")
                                ofile.write("</br>")
                                ofile.write(
                                    "<li><a href='https://github.com/PlatformOfTrust/docs/issues/new?assignees=&template=i-m-in-pain--here-s-the-symptoms.md&title=Customer+wish&labels=" + api.lower()+",Wish' title='Make a wish!' target='new'>Did we miss something? Make a wish!</a></li>")
                                ofile.write(
                                    "<div style='min-height:30px;'>&nbsp;</div>")
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
                        ofile.write("#"+line.replace("***", "**").replace("{version}", "v1"))
                    elif line.startswith("`***"):
                        ofile.write(line.replace(
                            "***", "**").replace("`", "").replace("{version}", "v1"))
                    else:
                        ofile.write(line.replace(
                            "***", "**").replace("{version}", "v1"))

    print("\n\nSlate file: " + str(outfile) + " created.")


# Parse the parameters
parser = argparse.ArgumentParser(description='Options')
parser.add_argument("--requestfolder")

args = parser.parse_args()

request_path = args.requestfolder

# Read the APIs that will be concatenated
try:
    with open(str(Path(request_path) / 'docs.json')) as file:
        data = json.load(file)
        APIs = data['APIs']
        examples_paths = data['examples_paths']
except:
    pass

# Merge all together
concatenate_files(request_path)
