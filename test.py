import requests
import json

file = {'file': ('pet', open('./resources/pet.jpg', 'rb'))}
response = requests.post(
    'https://petstore.swagger.io/v2/pet/2/uploadImage',
    # files = file
)

print(json.dumps({
    'raw_body': response.text,
    'status': response.status_code,
    'code': response.status_code
})) 